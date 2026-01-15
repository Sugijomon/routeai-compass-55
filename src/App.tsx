import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import SmartDashboard from "./components/SmartDashboard";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import ToolCatalog from "./components/ToolCatalog";
import UseCasesOverview from "./pages/UseCasesOverview";
import UseCaseDetail from "./pages/UseCaseDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

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
        
        {/* Use Cases - All authenticated users */}
        <Route 
          path="/use-cases" 
          element={
            <ProtectedRoute>
              <UseCasesOverview />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/use-cases/:id" 
          element={
            <ProtectedRoute>
              <UseCaseDetail />
            </ProtectedRoute>
          } 
        />
        
        {/* Tool Catalog - ADMIN ONLY */}
        <Route 
          path="/tools" 
          element={
            <AdminRoute>
              <ToolCatalog />
            </AdminRoute>
          } 
        />
        
        {/* Training - Protected */}
        <Route 
          path="/training" 
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-slate-900 mb-4">🎓 Training Platform</h1>
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
