import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./components/RoleSelector";
import UserDashboard from "./components/UserDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import OrgAdminDashboard from "./pages/OrgAdminDashboard";
import ToolCatalog from "./components/ToolCatalog";
import { AuthRoute } from "./components/AuthRoute";
import Auth from "./pages/Auth";
import NewAssessment from "./pages/NewAssessment";
import Assessment from "./pages/Assessment";
import Assessments from "./pages/Assessments";
import AssessmentGuard from "./components/guards/AssessmentGuard";
import { RequireSuperAdmin } from "./components/guards/RequireSuperAdmin";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminLessonEdit from "./pages/admin/AdminLessonEdit";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
// TODO: debug-only pagina's — niet opnemen in productie
// import AdminDatabaseCheck from "./pages/admin/AdminDatabaseCheck";
// import AdminRoutesAudit from "./pages/admin/AdminRoutesAudit";
import UserRolesManagement from "./pages/admin/UserRolesManagement";
import LessonPlayer from "./pages/learn/LessonPlayer";
import CoursePlayer from "./pages/learn/CoursePlayer";
import TrainingOverview from "./pages/learn/TrainingOverview";
import LessonQuestionsPage from "./pages/learn/LessonQuestionsPage";
// import DebugQuiz from "./pages/DebugQuiz";
import ContentEditorDashboard from "./pages/editor/ContentEditorDashboard";
import EditorDashboard from "./pages/editor/EditorDashboard";
import QuestionEditor from "./pages/editor/QuestionEditor";
import VragenBank from "./pages/editor/VragenBank";
import ExamenPage from "./pages/onboarding/ExamenPage";
import OrganisatieOnboarding from "./pages/onboarding/OrganisatieOnboarding";
import ShadowSurveyPage from "./pages/shadow-survey/ShadowSurveyPage";
import ShadowToolInventory from "./pages/shadow-survey/ShadowToolInventory";
import ShadowSurveyResults from "./pages/shadow-survey/ShadowSurveyResults";

import ScanDashboard from "./pages/admin/ScanDashboard";
import DpoDashboard from "./pages/admin/DpoDashboard";

import PublicScoreboardPage from "./pages/public/PublicScoreboardPage";
// Super Admin management pages
import OrganizationsManagement from "./pages/super-admin/OrganizationsManagement";
import OrgInvitePage from "./pages/super-admin/OrgInvitePage";
import ToolsLibraryManagement from "./pages/super-admin/ToolsLibraryManagement";
import LearningLibraryManagement from "./pages/super-admin/LearningLibraryManagement";
import CrossOrgUserManagement from "./pages/super-admin/CrossOrgUserManagement";
import ModelLibraryPage from "./pages/super-admin/ModelLibraryPage";
import TestChecklist from "./pages/super-admin/TestChecklist";
import PassportPage from "./pages/admin/PassportPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleSelector />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/scoreboard/:slug" element={<PublicScoreboardPage />} />
        
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
            <RequireSuperAdmin>
              <SuperAdminDashboard />
            </RequireSuperAdmin>
          } 
        />
        
        {/* Super Admin Management Pages */}
        <Route 
          path="/super-admin/organizations" 
          element={
            <RequireSuperAdmin>
              <OrganizationsManagement />
            </RequireSuperAdmin>
          } 
        />
        <Route 
          path="/super-admin/organizations/:orgId/uitnodigen" 
          element={
            <RequireSuperAdmin>
              <OrgInvitePage />
            </RequireSuperAdmin>
          } 
        />
        <Route 
          path="/super-admin/tools" 
          element={
            <RequireSuperAdmin>
              <ToolsLibraryManagement />
            </RequireSuperAdmin>
          } 
        />
        <Route 
          path="/super-admin/content" 
          element={
            <RequireSuperAdmin>
              <LearningLibraryManagement />
            </RequireSuperAdmin>
          } 
        />
        <Route 
          path="/super-admin/users" 
          element={
            <RequireSuperAdmin>
              <CrossOrgUserManagement />
            </RequireSuperAdmin>
          } 
        />
        <Route
          path="/super-admin/model-library"
          element={
            <RequireSuperAdmin>
              <ModelLibraryPage />
            </RequireSuperAdmin>
          }
        />
        <Route
          path="/super-admin/test-checklist"
          element={
            <RequireSuperAdmin>
              <TestChecklist />
            </RequireSuperAdmin>
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
        
        {/* Assessments List */}
        <Route
          path="/assessments"
          element={
            <AuthRoute>
              <Assessments />
            </AuthRoute>
          }
        />
        
        {/* Assessment Flow - Survey V1-V6 intake */}
        <Route 
          path="/assessments/new" 
          element={
            <AuthRoute>
              <AssessmentGuard>
                <NewAssessment />
              </AssessmentGuard>
            </AuthRoute>
          } 
        />
        <Route 
          path="/assessment/:id" 
          element={
            <AuthRoute>
              <Assessment />
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
          path="/editor/dashboard" 
          element={
            <AuthRoute requireAdmin>
              <EditorDashboard />
            </AuthRoute>
          } 
        />
        
        {/* Content Editor redirect */}
        <Route 
          path="/editor" 
          element={<Navigate to="/editor/cursussen" replace />}
        />
        
        <Route 
          path="/editor/cursussen" 
          element={
            <AuthRoute requireAdmin>
              <ContentEditorDashboard />
            </AuthRoute>
          } 
        />
        
        <Route 
          path="/editor/vragen" 
          element={
            <AuthRoute requireAdmin>
              <VragenBank />
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
          path="/admin/lessons/new"
          element={
            <AuthRoute requireAdmin>
              <AdminLessonEdit />
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
        
        {/* TODO: debug-only routes verwijderd uit productie-build
        <Route path="/admin/database-check" element={<AuthRoute requireAdmin><AdminDatabaseCheck /></AuthRoute>} />
        <Route path="/admin/routes-audit" element={<AuthRoute requireAdmin><AdminRoutesAudit /></AuthRoute>} />
        */}
        
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
        
        
        {/* Onboarding Exam — accessible without rijbewijs */}
        <Route
          path="/onboarding/examen"
          element={
            <AuthRoute skipRijbewijsCheck>
              <ExamenPage />
            </AuthRoute>
          }
        />
        
        {/* Organisatie onboarding — admin, no rijbewijs required */}
        <Route
          path="/onboarding/organisatie"
          element={
            <AuthRoute requireAdmin skipRijbewijsCheck>
              <OrganisatieOnboarding />
            </AuthRoute>
          }
        />
        
        {/* Shadow AI Scan */}
        <Route path="/shadow-survey" element={<AuthRoute><ShadowSurveyPage /></AuthRoute>} />
        <Route path="/shadow-survey/tools" element={<AuthRoute><ShadowToolInventory /></AuthRoute>} />
        <Route path="/admin/shadow-survey/results" element={<AuthRoute requireAdmin><ShadowSurveyResults /></AuthRoute>} />
        
        <Route path="/admin/shadow" element={<AuthRoute requireAdmin skipRijbewijsCheck><ScanDashboard /></AuthRoute>} />
        <Route path="/admin/dpo-dashboard" element={<AuthRoute requireAdmin skipRijbewijsCheck><DpoDashboard /></AuthRoute>} />
        <Route path="/admin/passport" element={<AuthRoute requireAdmin skipRijbewijsCheck><PassportPage /></AuthRoute>} />
        
        {/* TODO: debug-only — niet opnemen in productie
        <Route path="/debug-quiz" element={<DebugQuiz />} />
        */}
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
