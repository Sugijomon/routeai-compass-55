-- Voeg micro-learning velden toe aan learning_library
ALTER TABLE public.learning_library
  ADD COLUMN IF NOT EXISTS cluster_id text,
  ADD COLUMN IF NOT EXISTS archetype_codes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_activation_req boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS context_card text,
  ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL;

-- Voeg 'microlearning' toe aan content_type enum
ALTER TYPE public.learning_content_type ADD VALUE IF NOT EXISTS 'microlearning';