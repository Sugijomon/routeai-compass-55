import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import SmartDashboard from "./components/SmartDashboard";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import ToolCatalog from "./components/ToolCatalog";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AuthRoute } from "./components/AuthRoute";
import Auth from "./pages/Auth";
import NewAssessment from "./pages/NewAssessment";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminLessonEdit from "./pages/admin/AdminLessonEdit";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
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
        
        {/* Admin Dashboard - requires admin role */}
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
        
        {/* Learning Routes */}
        <Route 
          path="/training" 
          element={
            <AuthRoute>
              <TrainingOverview />
            </AuthRoute>
          } 
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
        {/* Debug page */}
        <Route path="/debug-quiz" element={<DebugQuiz />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
