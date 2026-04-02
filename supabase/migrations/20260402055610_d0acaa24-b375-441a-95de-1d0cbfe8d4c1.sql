
-- =============================================================
-- FIX 1: Protect learning_questions correct answers from students
-- =============================================================

-- RPC for students to get questions WITHOUT correct_answer/explanation
CREATE OR REPLACE FUNCTION public.get_lesson_questions_for_student(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'lesson_id', lesson_id,
        'question_type', question_type,
        'question_text', question_text,
        'question_config', question_config,
        'points', points,
        'order_index', order_index,
        'is_required', is_required,
        'org_id', org_id,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY order_index
    )
    FROM learning_questions
    WHERE lesson_id = p_lesson_id
  ), '[]'::jsonb);
END;
$$;

-- RPC for server-side answer checking (learning_questions system)
CREATE OR REPLACE FUNCTION public.check_quiz_answer(
  p_question_id uuid,
  p_lesson_id uuid,
  p_user_answer jsonb,
  p_time_spent integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question record;
  v_is_correct boolean;
  v_points_earned integer;
  v_attempt_number integer;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_question
  FROM learning_questions
  WHERE id = p_question_id AND lesson_id = p_lesson_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  CASE v_question.question_type
    WHEN 'multiple_choice' THEN
      v_is_correct := (p_user_answer->>'selected') = (v_question.correct_answer->>'selected');
    WHEN 'true_false' THEN
      v_is_correct := (p_user_answer->>'selected')::boolean = (v_question.correct_answer->>'selected')::boolean;
    WHEN 'multiple_select' THEN
      v_is_correct := (
        SELECT array_agg(val ORDER BY val)
        FROM jsonb_array_elements_text(p_user_answer->'selected') AS val
      ) = (
        SELECT array_agg(val ORDER BY val)
        FROM jsonb_array_elements_text(v_question.correct_answer->'selected') AS val
      );
    WHEN 'fill_in' THEN
      v_is_correct := lower(trim(p_user_answer->>'text')) = lower(trim(v_question.correct_answer->>'text'));
      IF NOT v_is_correct AND v_question.question_config ? 'accept_variations' THEN
        SELECT EXISTS(
          SELECT 1 FROM jsonb_array_elements_text(v_question.question_config->'accept_variations') AS var
          WHERE lower(trim(var)) = lower(trim(p_user_answer->>'text'))
        ) INTO v_is_correct;
      END IF;
    WHEN 'essay' THEN
      v_is_correct := NULL;
    ELSE
      v_is_correct := false;
  END CASE;

  v_points_earned := CASE WHEN v_is_correct THEN COALESCE(v_question.points, 1) ELSE 0 END;

  SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_attempt_number
  FROM learning_answers
  WHERE question_id = p_question_id AND user_id = v_user_id;

  INSERT INTO learning_answers (
    user_id, question_id, lesson_id, user_answer,
    is_correct, points_earned, time_spent_seconds, attempt_number, org_id
  ) VALUES (
    v_user_id, p_question_id, p_lesson_id, p_user_answer,
    v_is_correct, v_points_earned, p_time_spent, v_attempt_number,
    get_user_org_id(v_user_id)
  );

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points_earned', v_points_earned,
    'correct_answer', v_question.correct_answer,
    'explanation', v_question.explanation,
    'attempt_number', v_attempt_number
  );
END;
$$;

-- Restrict learning_questions SELECT to admins/editors only
DROP POLICY IF EXISTS "Users can view questions in their org lessons" ON public.learning_questions;

CREATE POLICY "Admins and editors can view all questions"
  ON public.learning_questions FOR SELECT
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR is_content_editor(auth.uid())
    OR is_org_admin(auth.uid())
  );

-- =============================================================
-- FIX 2: Prevent client-controlled exam scores on lesson_attempts
-- =============================================================

-- Trigger: force safe defaults on INSERT
CREATE OR REPLACE FUNCTION public.sanitize_lesson_attempt_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.passed := false;
  NEW.score := NULL;
  NEW.max_score := NULL;
  NEW.percentage := NULL;
  NEW.completed_at := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_lesson_attempt_insert_trigger
  BEFORE INSERT ON public.lesson_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_lesson_attempt_insert();

-- Trigger: prevent regular users from setting score fields on UPDATE
CREATE OR REPLACE FUNCTION public.protect_lesson_attempt_scores()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow changes from system context (finalize_lesson_attempt sets this flag)
  IF current_setting('app.system_write', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Super admin can override
  IF is_super_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Preserve old score values — client cannot override
  NEW.passed := OLD.passed;
  NEW.score := OLD.score;
  NEW.max_score := OLD.max_score;
  NEW.percentage := OLD.percentage;
  NEW.completed_at := OLD.completed_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_lesson_attempt_scores_trigger
  BEFORE UPDATE ON public.lesson_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_lesson_attempt_scores();

-- SECURITY DEFINER function to finalize an attempt with server-calculated score
CREATE OR REPLACE FUNCTION public.finalize_lesson_attempt(
  p_attempt_id uuid,
  p_quiz_answers jsonb -- { "block_id": raw_answer_value, ... }
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt record;
  v_lesson record;
  v_blocks jsonb;
  v_block jsonb;
  v_topic jsonb;
  v_block_id text;
  v_block_type text;
  v_block_points integer;
  v_earned integer := 0;
  v_max integer := 0;
  v_percentage numeric;
  v_passed boolean;
  v_time_spent integer;
  v_user_id uuid;
  v_correct boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_attempt FROM lesson_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF v_attempt.user_id != v_user_id THEN RAISE EXCEPTION 'Not your attempt'; END IF;
  IF v_attempt.completed_at IS NOT NULL THEN RAISE EXCEPTION 'Attempt already completed'; END IF;

  SELECT * INTO v_lesson FROM lessons WHERE id = v_attempt.lesson_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lesson not found'; END IF;

  v_blocks := v_lesson.blocks;

  -- Process all quiz blocks from lesson structure
  -- Version 2 (topics) or legacy (flat array)
  FOR v_block IN
    SELECT blk FROM (
      SELECT jsonb_array_elements(jsonb_array_elements(v_blocks->'topics')->'blocks') AS blk
      WHERE v_blocks ? 'topics'
      UNION ALL
      SELECT jsonb_array_elements(v_blocks) AS blk
      WHERE jsonb_typeof(v_blocks) = 'array'
    ) sub
  LOOP
    v_block_type := v_block->>'type';
    v_block_id := v_block->>'id';
    v_block_points := COALESCE((v_block->>'points')::integer, 10);

    -- Only process quiz blocks (skip essays — not auto-graded)
    IF v_block_type IN ('quiz_mc', 'quiz_tf', 'quiz_ms', 'quiz_fill') THEN
      v_max := v_max + v_block_points;

      IF p_quiz_answers ? v_block_id THEN
        v_correct := false;

        CASE v_block_type
          WHEN 'quiz_mc' THEN
            v_correct := (p_quiz_answers->v_block_id)::integer = (v_block->>'correct_answer')::integer;
          WHEN 'quiz_tf' THEN
            v_correct := (p_quiz_answers->>v_block_id)::boolean = (v_block->>'correct_answer')::boolean;
          WHEN 'quiz_ms' THEN
            v_correct := (
              SELECT array_agg(val::integer ORDER BY val::integer)
              FROM jsonb_array_elements_text(p_quiz_answers->v_block_id) AS val
            ) = (
              SELECT array_agg(val::integer ORDER BY val::integer)
              FROM jsonb_array_elements_text(v_block->'correct_answers') AS val
            );
          WHEN 'quiz_fill' THEN
            v_correct := lower(trim(p_quiz_answers->>v_block_id)) = lower(trim(v_block->>'correct_answer'));
            IF NOT v_correct AND v_block ? 'accept_variations' THEN
              SELECT EXISTS(
                SELECT 1 FROM jsonb_array_elements_text(v_block->'accept_variations') AS var
                WHERE lower(trim(var)) = lower(trim(p_quiz_answers->>v_block_id))
              ) INTO v_correct;
            END IF;
          ELSE
            v_correct := false;
        END CASE;

        IF v_correct THEN
          v_earned := v_earned + v_block_points;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Calculate percentage and pass/fail
  IF v_max > 0 THEN
    v_percentage := round((v_earned::numeric / v_max::numeric) * 100);
  ELSE
    v_percentage := 100;
  END IF;

  v_passed := v_percentage >= COALESCE(v_lesson.passing_score, 80);
  v_time_spent := EXTRACT(EPOCH FROM (now() - v_attempt.started_at))::integer;

  -- Enable system write flag for trigger bypass
  PERFORM set_config('app.system_write', 'true', true);

  UPDATE lesson_attempts SET
    score = v_earned,
    max_score = v_max,
    percentage = v_percentage,
    passed = v_passed,
    time_spent = v_time_spent,
    completed_at = now()
  WHERE id = p_attempt_id;

  PERFORM set_config('app.system_write', 'false', true);

  -- Also write completion record
  INSERT INTO user_lesson_completions (user_id, lesson_id, score, time_spent, completed_at, org_id)
  VALUES (v_user_id, v_attempt.lesson_id, v_percentage, v_time_spent, now(), get_user_org_id(v_user_id))
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET
    score = EXCLUDED.score,
    time_spent = EXCLUDED.time_spent,
    completed_at = EXCLUDED.completed_at;

  RETURN jsonb_build_object(
    'earned_points', v_earned,
    'max_points', v_max,
    'percentage', v_percentage,
    'passed', v_passed,
    'time_spent', v_time_spent
  );
END;
$$;
