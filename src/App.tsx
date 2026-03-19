import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { getRoleTier } from "@/lib/supabase";
import { useVerification } from "@/hooks/useVerification";

// Pages
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AccessError from "./pages/AccessError";
import Demo from "./pages/Demo";
import SetupProfile from "./pages/SetupProfile";
import PendingVerification from "./pages/PendingVerification";

// Layouts
import SchoolLayout from "./components/layouts/SchoolLayout";
import DistrictLayout from "./components/layouts/DistrictLayout";
import ProvinceLayout from "./components/layouts/ProvinceLayout";
import MinistryLayout from "./components/layouts/MinistryLayout";

// School Pages
import SchoolDashboard from "./pages/school/Dashboard";
import SubmitStatistics from "./pages/school/SubmitStatistics";
import SubmitReports from "./pages/school/SubmitReports";
import SubmitForms from "./pages/school/SubmitForms";
import SchoolAnnouncements from "./pages/school/Announcements";
import SchoolDocuments from "./pages/school/Documents";
import SchoolDeadlines from "./pages/school/Deadlines";

// District Pages
import DistrictDashboard from "./pages/district/Dashboard";

// Province Pages
import ProvinceDashboard from "./pages/province/Dashboard";

// Ministry Pages
import MinistryDashboard from "./pages/ministry/Dashboard";

// Shared
import PlaceholderPage from "./components/PlaceholderPage";

// Legacy Admin Pages (will be used under ministry)
import AdminSubmissions from "./pages/admin/Submissions";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminDocuments from "./pages/admin/Documents";
import AdminDeadlines from "./pages/admin/Deadlines";
import ManageSchools from "./pages/admin/ManageSchools";

const queryClient = new QueryClient();

type AllowedTier = 'school' | 'district' | 'province' | 'ministry';

/**
 * ProtectedRoute: Checks authentication, user role/tier, and verification status
 * If user is not verified and not in demo mode, redirects to /pending-verification
 */
function ProtectedRoute({ children, allowedTier }: { children: React.ReactNode; allowedTier: AllowedTier }) {
  const { user, role, loading, roleTier, isDemoMode } = useAuth();
  const verification = useVerification();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is missing or failed to load
  if (!role || !roleTier) {
    return <AccessError type="missing_role" />;
  }

  // Check if user has the required tier access
  if (roleTier !== allowedTier) {
    // Redirect to appropriate tier dashboard
    const redirectMap: Record<string, string> = {
      'school': '/school',
      'district': '/district',
      'province': '/province',
      'ministry': '/ministry'
    };
    return <Navigate to={redirectMap[roleTier] || '/login'} replace />;
  }

  // Check verification status (unless in demo mode, which bypasses verification)
  if (!isDemoMode && !verification.canAccessDashboard) {
    // User is verified OR in demo mode - allow access
    // Otherwise they need to complete setup or await verification
    if (verification.needsSetup) {
      return <Navigate to="/setup-profile" replace />;
    } else if (verification.isPending) {
      return <Navigate to="/pending-verification" replace />;
    }
    // If rejected, still show the pending page to inform them
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, role, roleTier, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get the correct dashboard route based on role tier
  const getDashboardRoute = (): string => {
    switch (roleTier) {
      case 'school': return '/school';
      case 'district': return '/district';
      case 'province': return '/province';
      case 'ministry': return '/ministry';
      default: return '/login';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={user && roleTier ? <Navigate to={getDashboardRoute()} replace /> : <Login />} />

      {/* User Setup & Verification Routes */}
      <Route path="/setup-profile" element={<SetupProfile />} />
      <Route path="/pending-verification" element={<PendingVerification />} />

      {/* Demo/Testing Mode - Choose role and see dashboards without auth */}
      {/* Only available in development environment */}
      {import.meta.env.MODE === 'development' && (
        <Route path="/demo" element={<Demo />} />
      )}

      {/* Legacy admin redirect */}
      <Route path="/admin/*" element={<Navigate to="/ministry" replace />} />

      {/* School Routes (teacher & principal) */}
      <Route path="/school" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><SchoolDashboard /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/statistics" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><SubmitStatistics /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/reports" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><SubmitReports /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/forms" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><SubmitForms /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/announcements" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><SchoolAnnouncements /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/documents" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><SchoolDocuments /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/deadlines" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><SchoolDeadlines /></SchoolLayout>
        </ProtectedRoute>
      } />

      {/* District Routes */}
      <Route path="/district" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><DistrictDashboard /></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/submissions" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><PlaceholderPage title="School Submissions" description="View and verify submissions from schools in your district" /></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/verify" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><PlaceholderPage title="Verify Data" description="Review and approve school data submissions" /></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/schools" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><PlaceholderPage title="Schools" description="Manage schools in your district" /></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/announcements" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><SchoolAnnouncements /></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/documents" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><SchoolDocuments /></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/deadlines" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><SchoolDeadlines /></DistrictLayout>
        </ProtectedRoute>
      } />

      {/* Province Routes */}
      <Route path="/province" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><ProvinceDashboard /></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/districts" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><PlaceholderPage title="Districts" description="View and manage districts in your province" /></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/analytics" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><PlaceholderPage title="Analytics" description="Province-level analytics and trend data" /></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/submissions" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><PlaceholderPage title="Submissions" description="View aggregated submissions from all districts" /></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/announcements" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><SchoolAnnouncements /></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/documents" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><SchoolDocuments /></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/deadlines" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><SchoolDeadlines /></ProvinceLayout>
        </ProtectedRoute>
      } />

      {/* Ministry Routes */}
      <Route path="/ministry" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><MinistryDashboard /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/analytics" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><PlaceholderPage title="National Analytics" description="Nation-wide data analysis and trends" /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/provinces" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><PlaceholderPage title="Provinces" description="View all 34 provinces and their data" /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/submissions" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><AdminSubmissions /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/announcements" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><AdminAnnouncements /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/documents" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><AdminDocuments /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/deadlines" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><AdminDeadlines /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/users" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><PlaceholderPage title="Manage Users" description="Create and manage user accounts for all levels" /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/schools" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><ManageSchools /></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/export" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><PlaceholderPage title="Export Reports" description="Generate and download national reports in Excel and PDF" /></MinistryLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocalizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LocalizationProvider>
  </QueryClientProvider>
);

export default App;
