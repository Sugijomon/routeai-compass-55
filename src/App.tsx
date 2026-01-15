import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import SmartDashboard from "./components/SmartDashboard";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import ToolCatalog from "./components/ToolCatalog";
import UseCasesOverview from "./pages/UseCasesOverview";
import UseCaseDetail from "./pages/UseCaseDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route path="/dashboard" element={<SmartDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        
        {/* Use Cases - Available for all authenticated users */}
        <Route path="/use-cases" element={<UseCasesOverview />} />
        <Route path="/use-cases/:id" element={<UseCaseDetail />} />
        
        {/* Tools - Admin only */}
        <Route path="/tools" element={<ToolCatalog />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
