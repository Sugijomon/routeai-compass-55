import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  blocks: unknown;
  created_at: string;
  lesson_type: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  required_for_onboarding: boolean;
  unlocks_capability: string | null;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  has_ai_rijbewijs: boolean;
}

interface UserRole {
  role: string;
}

export default function DebugQuiz() {
  const { user, isAdmin } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [specificLesson, setSpecificLesson] = useState<Lesson | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDebugData() {
      const errorList: string[] = [];

      // Fetch all lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .order("created_at", { ascending: false });

      if (lessonsError) {
        errorList.push(`Lessons RLS Error: ${lessonsError.message} (Code: ${lessonsError.code})`);
      } else {
        setLessons(lessonsData || []);
      }

      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (coursesError) {
        errorList.push(`Courses RLS Error: ${coursesError.message} (Code: ${coursesError.code})`);
      } else {
        setCourses(coursesData || []);
      }

      // Fetch current user profile
      if (user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          errorList.push(`Profile RLS Error: ${profileError.message} (Code: ${profileError.code})`);
        } else {
          setProfile(profileData);
        }

        // Fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesError) {
          errorList.push(`Roles RLS Error: ${rolesError.message} (Code: ${rolesError.code})`);
        } else {
          setRoles(rolesData || []);
        }
      }

      // Fetch specific lesson (52b3c300-fa99-49b1-8b8a-7682b4c3d97c)
      const targetId = "52b3c300-fa99-49b1-8b8a-7682b4c3d97c";
      const { data: specificData, error: specificError } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (specificError) {
        errorList.push(`Specific Lesson RLS Error: ${specificError.message} (Code: ${specificError.code})`);
      } else if (!specificData) {
        errorList.push(`Specific Lesson: No lesson found with ID ${targetId}`);
      } else {
        setSpecificLesson(specificData);
      }

      setErrors(errorList);
      setLoading(false);
    }

    fetchDebugData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Loading debug data...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug Quiz Page</h1>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>User ID:</strong> <code className="bg-muted px-2 py-1 rounded">{user?.id || "Not logged in"}</code></div>
          <div><strong>Email:</strong> {user?.email || "N/A"}</div>
          <div><strong>Is Admin (hook):</strong> <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Yes" : "No"}</Badge></div>
          <div><strong>Roles from DB:</strong> {roles.length > 0 ? roles.map(r => <Badge key={r.role} className="mr-1">{r.role}</Badge>) : "None found"}</div>
          {profile && (
            <>
              <div><strong>Profile Full Name:</strong> {profile.full_name || "N/A"}</div>
              <div><strong>Has AI Rijbewijs:</strong> <Badge variant={profile.has_ai_rijbewijs ? "default" : "secondary"}>{profile.has_ai_rijbewijs ? "Yes" : "No"}</Badge></div>
            </>
          )}
        </CardContent>
      </Card>

      {/* RLS Errors */}
      <Card className={errors.length > 0 ? "border-destructive" : "border-green-500"}>
        <CardHeader>
          <CardTitle className={errors.length > 0 ? "text-destructive" : "text-green-600"}>
            RLS Policy Status {errors.length > 0 ? `(${errors.length} errors)` : "(No errors)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <p className="text-green-600">✓ All queries executed successfully</p>
          ) : (
            <ul className="space-y-2">
              {errors.map((err, i) => (
                <li key={i} className="text-destructive bg-destructive/10 p-2 rounded">
                  {err}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Specific Lesson */}
      <Card>
        <CardHeader>
          <CardTitle>Specific Lesson (52b3c300...)</CardTitle>
        </CardHeader>
        <CardContent>
          {specificLesson ? (
            <div className="space-y-2">
              <div><strong>ID:</strong> <code className="bg-muted px-2 py-1 rounded text-xs">{specificLesson.id}</code></div>
              <div><strong>Title:</strong> {specificLesson.title}</div>
              <div><strong>Type:</strong> <Badge>{specificLesson.lesson_type}</Badge></div>
              <div><strong>Published:</strong> <Badge variant={specificLesson.is_published ? "default" : "secondary"}>{specificLesson.is_published ? "Yes" : "No"}</Badge></div>
              <div><strong>Blocks:</strong> <code className="text-xs">{JSON.stringify(specificLesson.blocks).slice(0, 200)}...</code></div>
            </div>
          ) : (
            <p className="text-muted-foreground">Lesson not found or RLS blocked access</p>
          )}
        </CardContent>
      </Card>

      {/* All Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>All Lessons ({lessons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <p className="text-muted-foreground">No lessons found (RLS may be blocking)</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium">{lesson.title}</span>
                    <code className="ml-2 text-xs text-muted-foreground">{lesson.id.slice(0, 8)}...</code>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={lesson.is_published ? "default" : "outline"}>
                      {lesson.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="secondary">{lesson.lesson_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Courses */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground">No courses found (RLS may be blocking)</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium">{course.title}</span>
                    <code className="ml-2 text-xs text-muted-foreground">{course.id.slice(0, 8)}...</code>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={course.is_published ? "default" : "outline"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                    {course.required_for_onboarding && <Badge variant="secondary">Onboarding</Badge>}
                    {course.unlocks_capability && <Badge>{course.unlocks_capability}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
