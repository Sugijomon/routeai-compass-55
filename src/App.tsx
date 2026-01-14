import SmartDashboard from './components/SmartDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import ToolCatalog from './components/ToolCatalog';
import RoleSelector from './components/RoleSelector';

<Routes>
  {/* Login */}
  <Route path="/" element={<RoleSelector />} />
  
  {/* Legacy/Bookmark support - redirects to correct dashboard */}
  <Route path="/dashboard" element={<SmartDashboard />} />
  
  {/* Explicit dashboard routes */}
  <Route path="/admin-dashboard" element={<AdminDashboard />} />
  <Route path="/user-dashboard" element={<UserDashboard />} />
  
  {/* Shared routes */}
  <Route path="/tools" element={<ToolCatalog />} />
  <Route path="/tools/:id" element={<ToolDetail />} />
  <Route path="/training" element={<TrainingPlatform />} />
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
