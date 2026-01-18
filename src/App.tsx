import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import SmartDashboard from "./components/SmartDashboard";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import ToolCatalog from "./components/ToolCatalog";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import NewAssessment from "./pages/NewAssessment";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminLessonEdit from "./pages/admin/AdminLessonEdit";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import LessonPlayer from "./pages/learn/LessonPlayer";
import CoursePlayer from "./pages/learn/CoursePlayer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        
        {/* SmartDashboard - Protected */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <SmartDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        
        {/* User Dashboard */}
        <Route 
          path="/user-dashboard" 
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Assessment Flow - Survey V1-V6 intake */}
        <Route 
          path="/assessments/new" 
          element={
            <ProtectedRoute>
              <NewAssessment />
            </ProtectedRoute>
          } 
        />
        
        {/* Tool Catalog - ADMIN ONLY (governance, not permissions) */}
        <Route 
          path="/tools" 
          element={
            <AdminRoute>
              <ToolCatalog />
            </AdminRoute>
          } 
        />
        
        {/* Admin Lessons Management */}
        <Route 
          path="/admin/lessons" 
          element={
            <AdminRoute>
              <AdminLessons />
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/lessons/:lessonId/edit" 
          element={
            <AdminRoute>
              <AdminLessonEdit />
            </AdminRoute>
          } 
        />
        
        {/* Admin Courses Management */}
        <Route 
          path="/admin/courses" 
          element={
            <AdminRoute>
              <AdminCourses />
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/courses/:courseId/edit" 
          element={
            <AdminRoute>
              <AdminCourseEdit />
            </AdminRoute>
          } 
        />
        
        {/* Lesson Player - Protected */}
        <Route 
          path="/learn/:lessonId" 
          element={
            <ProtectedRoute>
              <LessonPlayer />
            </ProtectedRoute>
          } 
        />
        
        {/* Course Player - Protected */}
        <Route 
          path="/learn/course/:courseId" 
          element={
            <ProtectedRoute>
              <CoursePlayer />
            </ProtectedRoute>
          } 
        />
        
        {/* Training - Protected */}
        <Route 
          path="/training" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-slate-900 mb-4">🎓 Leren</h1>
                  <p className="text-slate-600">Deze pagina wordt binnenkort beschikbaar.</p>
                </div>
              </div>
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
