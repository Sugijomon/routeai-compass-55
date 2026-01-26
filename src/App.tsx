import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import SmartDashboard from "./components/SmartDashboard";
import AdminDashboard from "./components/AdminDashboard";
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
import LessonPlayer from "./pages/learn/LessonPlayer";
import CoursePlayer from "./pages/learn/CoursePlayer";
import TrainingOverview from "./pages/learn/TrainingOverview";
import DebugQuiz from "./pages/DebugQuiz";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleSelector />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* SmartDashboard - Protected with real auth */}
        <Route 
          path="/dashboard" 
          element={
            <AuthRoute>
              <SmartDashboard />
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
        
        {/* Org Admin Dashboard - requires org_admin, content_editor, or manager role */}
        <Route 
          path="/org-admin" 
          element={
            <AuthRoute requireAdmin>
              <OrgAdminDashboard />
            </AuthRoute>
          } 
        />
        
        {/* Legacy Admin Dashboard - redirect to appropriate new dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={
            <AuthRoute requireAdmin>
              <AdminDashboard />
            </AuthRoute>
          } 
        />
        
        {/* User Dashboard */}
        <Route 
          path="/user-dashboard" 
          element={
            <AuthRoute>
              <UserDashboard />
            </AuthRoute>
          } 
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
        
        {/* Admin redirect */}
        <Route path="/admin" element={<Navigate to="/admin/lessons" replace />} />
        
        {/* Debug page */}
        <Route path="/debug-quiz" element={<DebugQuiz />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
