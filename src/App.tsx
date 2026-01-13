import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "@/components/RoleSelector";
import UserDashboard from "@/components/UserDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import TrainingFlow from "@/components/TrainingFlow";
import ToolCatalog from "@/components/ToolCatalog";
import ToolDetail from "@/components/ToolDetail";
import { useAppStore } from "@/store/useAppStore";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Welcome / Login Screen */}
        <Route path="/" element={<RoleSelector />} />

        {/* Dashboard - routes to correct dashboard based on user role */}
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* Training Flow */}
        <Route path="/training" element={<TrainingFlow />} />

        {/* Tool Catalog */}
        <Route path="/tools" element={<ToolCatalog />} />
        <Route path="/tools/:toolId" element={<ToolDetail />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Helper component to route to correct dashboard based on user role
function DashboardRouter() {
  const { currentUser } = useAppStore();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role === "org_admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}

export default App;
