import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
// SmartDashboard removed - no longer needed, routes directly to role-specific dashboards
import UserDashboard from "./components/UserDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import OrgAdminDashboard from "./pages/OrgAdminDashboard";
import ToolCatalog from "./components/ToolCatalog";
import { AuthRoute } from "./components/AuthRoute";
import Auth from "./pages/Auth";
import NewAssessment from "./pages/NewAssessment";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminLessonEdit from "./pages/admin/AdminLessonEdit";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import AdminDatabaseCheck from "./pages/admin/AdminDatabaseCheck";
import AdminRoutesAudit from "./pages/admin/AdminRoutesAudit";
import UserRolesManagement from "./pages/admin/UserRolesManagement";
import LessonPlayer from "./pages/learn/LessonPlayer";
import CoursePlayer from "./pages/learn/CoursePlayer";
import TrainingOverview from "./pages/learn/TrainingOverview";
import LessonQuestionsPage from "./pages/learn/LessonQuestionsPage";
import DebugQuiz from "./pages/DebugQuiz";
import ContentEditorDashboard from "./pages/editor/ContentEditorDashboard";
import QuestionEditor from "./pages/editor/QuestionEditor";

// Super Admin management pages
import OrganizationsManagement from "./pages/super-admin/OrganizationsManagement";
import ToolsLibraryManagement from "./pages/super-admin/ToolsLibraryManagement";
import LearningLibraryManagement from "./pages/super-admin/LearningLibraryManagement";
import CrossOrgUserManagement from "./pages/super-admin/CrossOrgUserManagement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleSelector />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* User Dashboard - Protected with real auth */}
        <Route 
          path="/dashboard" 
          element={
            <AuthRoute>
              <UserDashboard />
            </AuthRoute>
          } 
        />
        
        {/* Super Admin Dashboard - requires super_admin role */}
        <Route 
          path="/super-admin" 
          element={
            <AuthRoute requireAdmin>
              <SuperAdminDashboard />
            </AuthRoute>
          } 
        />
        
        {/* Super Admin Management Pages */}
        <Route 
          path="/super-admin/organizations" 
          element={
            <AuthRoute requireAdmin>
              <OrganizationsManagement />
            </AuthRoute>
          } 
        />
        <Route 
          path="/super-admin/tools" 
          element={
            <AuthRoute requireAdmin>
              <ToolsLibraryManagement />
            </AuthRoute>
          } 
        />
        <Route 
          path="/super-admin/content" 
          element={
            <AuthRoute requireAdmin>
              <LearningLibraryManagement />
            </AuthRoute>
          } 
        />
        <Route 
          path="/super-admin/users" 
          element={
            <AuthRoute requireAdmin>
              <CrossOrgUserManagement />
            </AuthRoute>
          } 
        />
        
        {/* Org Admin Dashboard - now at /admin */}
        <Route 
          path="/admin" 
          element={
            <AuthRoute requireAdmin>
              <OrgAdminDashboard />
            </AuthRoute>
          } 
        />
        
        {/* Legacy URL redirects */}
        <Route path="/admin-dashboard" element={<Navigate to="/super-admin" replace />} />
        <Route path="/org-admin" element={<Navigate to="/admin" replace />} />
        
        {/* User Dashboard redirect */}
        <Route 
          path="/user-dashboard" 
          element={<Navigate to="/dashboard" replace />}
        />
        
        {/* Assessment Flow - Survey V1-V6 intake */}
        <Route 
          path="/assessments/new" 
          element={
            <AuthRoute>
              <NewAssessment />
            </AuthRoute>
          } 
        />
        
        {/* Tool Catalog - ADMIN ONLY */}
        <Route 
          path="/tools" 
          element={
            <AuthRoute requireAdmin>
              <ToolCatalog />
            </AuthRoute>
          } 
        />
        
        {/* Content Editor Dashboard */}
        <Route 
          path="/editor" 
          element={
            <AuthRoute requireAdmin>
              <ContentEditorDashboard />
            </AuthRoute>
          } 
        />
        
        {/* Question Editor */}
        <Route 
          path="/editor/questions/new" 
          element={
            <AuthRoute requireAdmin>
              <QuestionEditor />
            </AuthRoute>
          } 
        />
        
        <Route 
          path="/editor/questions/:questionId/edit" 
          element={
            <AuthRoute requireAdmin>
              <QuestionEditor />
            </AuthRoute>
          } 
        />
        
        {/* Admin Lessons Management */}
        <Route 
          path="/admin/lessons" 
          element={
            <AuthRoute requireAdmin>
              <AdminLessons />
            </AuthRoute>
          } 
        />
        
        <Route
          path="/admin/lessons/:lessonId/edit" 
          element={
            <AuthRoute requireAdmin>
              <AdminLessonEdit />
            </AuthRoute>
          } 
        />
        
        {/* Admin Courses Management */}
        <Route 
          path="/admin/courses" 
          element={
            <AuthRoute requireAdmin>
              <AdminCourses />
            </AuthRoute>
          } 
        />
        
        <Route 
          path="/admin/courses/:courseId/edit" 
          element={
            <AuthRoute requireAdmin>
              <AdminCourseEdit />
            </AuthRoute>
          } 
        />
        
        {/* Admin Database Check */}
        <Route 
          path="/admin/database-check" 
          element={
            <AuthRoute requireAdmin>
              <AdminDatabaseCheck />
            </AuthRoute>
          } 
        />
        
        {/* Admin Routes Audit */}
        <Route 
          path="/admin/routes-audit" 
          element={
            <AuthRoute requireAdmin>
              <AdminRoutesAudit />
            </AuthRoute>
          } 
        />
        
        {/* User Roles Management */}
        <Route 
          path="/admin/users/roles" 
          element={
            <AuthRoute requireAdmin>
              <UserRolesManagement />
            </AuthRoute>
          } 
        />
        
        {/* Learning Routes - consolidated to /learn */}
        <Route
          path="/training" 
          element={<Navigate to="/learn" replace />} 
        />
        
        <Route 
          path="/learn" 
          element={
            <AuthRoute>
              <TrainingOverview />
            </AuthRoute>
          } 
        />
        
        {/* Lesson Player - Protected */}
        <Route 
          path="/learn/:lessonId" 
          element={
            <AuthRoute>
              <LessonPlayer />
            </AuthRoute>
          } 
        />
        
        {/* Course Player - Protected */}
        <Route 
          path="/learn/course/:courseId" 
          element={
            <AuthRoute>
              <CoursePlayer />
            </AuthRoute>
          } 
        />
        
        {/* Lesson Questions Page - Protected */}
        <Route 
          path="/learn/:lessonId/questions" 
          element={
            <AuthRoute>
              <LessonQuestionsPage />
            </AuthRoute>
          } 
        />
        
        
        {/* Debug page */}
        <Route path="/debug-quiz" element={<DebugQuiz />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
