import { useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw,
  Trash2,
  Shield,
  Lock,
  Globe
} from "lucide-react";
import { useDashboardRedirect } from "@/hooks/useDashboardRedirect";

type RouteStatus = "working" | "redirecting" | "empty" | "error" | "unknown";
type AuthType = "public" | "protected" | "admin";

interface RouteInfo {
  path: string;
  component: string;
  authType: AuthType;
  roleRequired: string | null;
  status: RouteStatus;
  issue: string | null;
  fixNeeded: string | null;
  deprecated: boolean;
}

// Complete route inventory based on App.tsx analysis
const ROUTE_INVENTORY: RouteInfo[] = [
  // Public Routes
  {
    path: "/",
    component: "RoleSelector",
    authType: "public",
    roleRequired: null,
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/auth",
    component: "Auth",
    authType: "public",
    roleRequired: null,
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/debug-quiz",
    component: "DebugQuiz",
    authType: "public",
    roleRequired: null,
    status: "working",
    issue: "Debug page exposed publicly",
    fixNeeded: "Consider adding admin guard or removing in production",
    deprecated: false,
  },

  // Protected Routes (Any authenticated user)
  {
    path: "/dashboard",
    component: "SmartDashboard",
    authType: "protected",
    roleRequired: null,
    status: "redirecting",
    issue: "Only redirects, no actual content",
    fixNeeded: "Working as intended - redirects based on role",
    deprecated: false,
  },
  {
    path: "/user-dashboard",
    component: "UserDashboard",
    authType: "protected",
    roleRequired: null,
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/assessments/new",
    component: "NewAssessment",
    authType: "protected",
    roleRequired: null,
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/training",
    component: "TrainingOverview",
    authType: "protected",
    roleRequired: null,
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/learn",
    component: "TrainingOverview",
    authType: "protected",
    roleRequired: null,
    status: "working",
    issue: "Duplicate of /training",
    fixNeeded: "Consider consolidating to single route",
    deprecated: false,
  },
  {
    path: "/learn/:lessonId",
    component: "LessonPlayer",
    authType: "protected",
    roleRequired: null,
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/learn/course/:courseId",
    component: "CoursePlayer",
    authType: "protected",
    roleRequired: null,
    status: "empty",
    issue: "Shows 'Cursus niet gevonden' - no published courses exist",
    fixNeeded: "Create and publish courses, or improve empty state",
    deprecated: false,
  },

  // Admin Routes
  {
    path: "/admin-dashboard",
    component: "AdminDashboard",
    authType: "admin",
    roleRequired: "admin",
    status: "empty",
    issue: "Uses mock useAppStore instead of real Supabase data",
    fixNeeded: "Refactor to use Supabase queries for profiles/user_roles",
    deprecated: false,
  },
  {
    path: "/tools",
    component: "ToolCatalog",
    authType: "admin",
    roleRequired: "admin",
    status: "working",
    issue: "Uses mock data from mockTools.ts",
    fixNeeded: "Consider creating tools table in Supabase",
    deprecated: false,
  },
  {
    path: "/admin/lessons",
    component: "AdminLessons",
    authType: "admin",
    roleRequired: "admin",
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/admin/lessons/:lessonId/edit",
    component: "AdminLessonEdit",
    authType: "admin",
    roleRequired: "admin",
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/admin/courses",
    component: "AdminCourses",
    authType: "admin",
    roleRequired: "admin",
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/admin/courses/:courseId/edit",
    component: "AdminCourseEdit",
    authType: "admin",
    roleRequired: "admin",
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/admin/database-check",
    component: "AdminDatabaseCheck",
    authType: "admin",
    roleRequired: "admin",
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },
  {
    path: "/admin/routes-audit",
    component: "AdminRoutesAudit",
    authType: "admin",
    roleRequired: "admin",
    status: "working",
    issue: null,
    fixNeeded: null,
    deprecated: false,
  },

  // Routes that don't exist but are referenced
  {
    path: "/tools/:toolId",
    component: "ToolDetail (missing)",
    authType: "admin",
    roleRequired: "admin",
    status: "error",
    issue: "Route not defined in App.tsx - redirects to catch-all",
    fixNeeded: "Add route or remove references to it",
    deprecated: true,
  },
  {
    path: "/admin",
    component: "None",
    authType: "admin",
    roleRequired: "admin",
    status: "error",
    issue: "Route not defined - redirects to catch-all '/'",
    fixNeeded: "Add redirect to /admin/lessons or remove references",
    deprecated: true,
  },
];

// Auth guard analysis
const AUTH_GUARD_ANALYSIS = [
  {
    guard: "AuthRoute",
    file: "src/components/AuthRoute.tsx",
    behavior: "Redirects to /auth if not logged in, redirects to /dashboard if requireAdmin but not admin",
    issues: ["Works correctly", "Role check uses user_roles table via useAuth hook"],
  },
  {
    guard: "ProtectedRoute",
    file: "src/components/ProtectedRoute.tsx",
    behavior: "Uses mock useAppStore - NOT REAL AUTH",
    issues: ["Uses mock store instead of Supabase", "Should be removed or migrated"],
  },
  {
    guard: "AdminRoute",
    file: "src/components/AdminRoute.tsx",
    behavior: "Uses mock useAppStore - NOT REAL AUTH",
    issues: ["Uses mock store instead of Supabase", "Should be removed or migrated"],
  },
];

export default function AdminRoutesAudit() {
  const dashboardUrl = useDashboardRedirect();
  const [routes] = useState<RouteInfo[]>(ROUTE_INVENTORY);
  const [testing, setTesting] = useState<string | null>(null);

  const getStatusBadge = (status: RouteStatus) => {
    switch (status) {
      case "working":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Working</Badge>;
      case "redirecting":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Redirecting</Badge>;
      case "empty":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Empty</Badge>;
      case "error":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getAuthBadge = (authType: AuthType) => {
    switch (authType) {
      case "public":
        return (
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
        );
      case "protected":
        return (
          <Badge variant="outline" className="gap-1 border-blue-500/30 text-blue-600">
            <Lock className="h-3 w-3" />
            Protected
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
    }
  };

  const handleTestRoute = async (path: string) => {
    setTesting(path);
    // Open in new tab to test
    window.open(path, "_blank");
    setTimeout(() => setTesting(null), 1000);
  };

  // Calculate summary stats
  const stats = {
    total: routes.length,
    working: routes.filter((r) => r.status === "working").length,
    redirecting: routes.filter((r) => r.status === "redirecting").length,
    empty: routes.filter((r) => r.status === "empty").length,
    error: routes.filter((r) => r.status === "error").length,
    deprecated: routes.filter((r) => r.deprecated).length,
    withIssues: routes.filter((r) => r.issue).length,
  };

  return (
    <AdminPageLayout 
      title="Route Audit"
      breadcrumbs={[
        { label: "Admin", href: dashboardUrl },
        { label: "Route Audit" }
      ]}
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Routes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.working}</div>
              <p className="text-xs text-muted-foreground">Working</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.redirecting}</div>
              <p className="text-xs text-muted-foreground">Redirecting</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">{stats.empty}</div>
              <p className="text-xs text-muted-foreground">Empty</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <p className="text-xs text-muted-foreground">Error</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-500">{stats.deprecated}</div>
              <p className="text-xs text-muted-foreground">Deprecated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{stats.withIssues}</div>
              <p className="text-xs text-muted-foreground">With Issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Auth Guards Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Auth Guard Analysis
            </CardTitle>
            <CardDescription>
              Analysis of authentication guards and their redirect behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {AUTH_GUARD_ANALYSIS.map((guard) => (
                <div key={guard.guard} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{guard.guard}</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{guard.file}</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{guard.behavior}</p>
                  <div className="flex flex-wrap gap-2">
                    {guard.issues.map((issue, i) => (
                      <Badge 
                        key={i} 
                        variant={issue.includes("mock") || issue.includes("removed") ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Route Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Route Inventory</CardTitle>
            <CardDescription>
              All defined routes with their current status and issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Route</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Auth</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[200px]">Issue</TableHead>
                  <TableHead className="w-[200px]">Fix Needed</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow 
                    key={route.path} 
                    className={route.deprecated ? "opacity-60 bg-muted/30" : ""}
                  >
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        {route.deprecated && <Trash2 className="h-3 w-3 text-red-500" />}
                        {route.path}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{route.component}</TableCell>
                    <TableCell>{getAuthBadge(route.authType)}</TableCell>
                    <TableCell>
                      {route.roleRequired ? (
                        <Badge variant="outline" className="text-xs">
                          {route.roleRequired}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(route.status)}</TableCell>
                    <TableCell className="text-xs">
                      {route.issue ? (
                        <div className="flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                          <span>{route.issue}</span>
                        </div>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {route.fixNeeded || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestRoute(route.path)}
                        disabled={testing === route.path || route.path.includes(":")}
                        className="gap-1"
                      >
                        {testing === route.path ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <ExternalLink className="h-3 w-3" />
                        )}
                        Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Critical Issues */}
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Critical Issues to Fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4 py-2">
                <h4 className="font-medium">1. AdminDashboard uses mock store</h4>
                <p className="text-sm text-muted-foreground">
                  The /admin-dashboard page uses <code>useAppStore</code> which contains mock data 
                  instead of querying real users from Supabase profiles/user_roles tables.
                </p>
                <Badge variant="outline" className="mt-2">Fix: Refactor to use Supabase queries</Badge>
              </div>

              <div className="border-l-4 border-red-500 pl-4 py-2">
                <h4 className="font-medium">2. Legacy auth guards still exist</h4>
                <p className="text-sm text-muted-foreground">
                  <code>ProtectedRoute</code> and <code>AdminRoute</code> components use mock 
                  useAppStore but are imported in App.tsx. They should be removed.
                </p>
                <Badge variant="outline" className="mt-2">Fix: Remove unused imports from App.tsx</Badge>
              </div>

              <div className="border-l-4 border-amber-500 pl-4 py-2">
                <h4 className="font-medium">3. /tools/:toolId route missing</h4>
                <p className="text-sm text-muted-foreground">
                  ToolDetail component exists but route is not defined. Navigating to tool 
                  detail falls through to catch-all.
                </p>
                <Badge variant="outline" className="mt-2">Fix: Add route or remove ToolDetail references</Badge>
              </div>

              <div className="border-l-4 border-amber-500 pl-4 py-2">
                <h4 className="font-medium">4. Course player shows empty</h4>
                <p className="text-sm text-muted-foreground">
                  /learn/course/:courseId shows "Cursus niet gevonden" because no published 
                  courses exist in the database yet.
                </p>
                <Badge variant="outline" className="mt-2">Fix: Create and publish courses in admin</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Refactor AdminDashboard</strong> - Replace useAppStore with Supabase 
                queries for profiles and user_roles
              </li>
              <li>
                <strong>Remove legacy guards</strong> - Delete ProtectedRoute and AdminRoute 
                imports from App.tsx (they're not used)
              </li>
              <li>
                <strong>Add /tools/:toolId route</strong> - Or remove ToolDetail.tsx if not needed
              </li>
              <li>
                <strong>Consider /admin redirect</strong> - Add redirect from /admin to /admin/lessons
              </li>
              <li>
                <strong>Consolidate /learn and /training</strong> - They render the same component
              </li>
              <li>
                <strong>Protect /debug-quiz</strong> - Add admin guard or remove in production
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
