import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { ConfirmationProvider } from "@/contexts/ConfirmationContext";
import { SmartConfirmationDialog } from "@/components/SmartConfirmationDialog";
import { getRoleTier } from "@/lib/supabase";
import { useVerification } from "@/hooks/useVerification";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorSimulationPanel } from "@/lib/errorSimulation";

// Pages - Core pages loaded immediately, others lazy-loaded for performance
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AccessError from "./pages/AccessError";
import SetupProfile from "./pages/SetupProfile";
import AfghanistanInfoPage from "./pages/AfghanistanInfoPage";
import AuthCallback from "./pages/AuthCallback";
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Lazy load heavy pages for better performance
const Demo = lazy(() => import("./pages/Demo"));
const PendingVerification = lazy(() => import("./pages/PendingVerification"));
const TestButtons = lazy(() => import("./pages/TestButtons"));

// Layouts
import SchoolLayout from "./components/layouts/SchoolLayout";
import DistrictLayout from "./components/layouts/DistrictLayout";
import ProvinceLayout from "./components/layouts/ProvinceLayout";
import MinistryLayout from "./components/layouts/MinistryLayout";

// School Pages - Lazy loaded for code splitting
const SchoolDashboard = lazy(() => import("./pages/school/Dashboard"));
const SubmitStatistics = lazy(() => import("./pages/school/SubmitStatistics"));
const SubmitReports = lazy(() => import("./pages/school/SubmitReports"));
const SubmitForms = lazy(() => import("./pages/school/SubmitForms"));
const SchoolAnnouncements = lazy(() => import("./pages/school/Announcements"));
const SchoolDocuments = lazy(() => import("./pages/school/Documents"));
const SchoolDeadlines = lazy(() => import("./pages/school/Deadlines"));

// District Pages - Lazy loaded
const DistrictDashboard = lazy(() => import("./pages/district/Dashboard"));
const DistrictSubmissions = lazy(() => import("./pages/district/Submissions"));
const DistrictVerifyData = lazy(() => import("./pages/district/VerifyData"));
const DistrictSchools = lazy(() => import("./pages/district/Schools"));

// Province Pages - Lazy loaded
const ProvinceDashboard = lazy(() => import("./pages/province/Dashboard"));
const ProvinceDistricts = lazy(() => import("./pages/province/Districts"));
const ProvinceAnalytics = lazy(() => import("./pages/province/Analytics"));
const ProvinceSubmissions = lazy(() => import("./pages/province/Submissions"));

// Ministry Pages - Lazy loaded
const MinistryDashboard = lazy(() => import("./pages/ministry/Dashboard"));
const MinistryAnalytics = lazy(() => import("./pages/ministry/Analytics"));
const MinistryProvinces = lazy(() => import("./pages/ministry/Provinces"));
const MinistryUsers = lazy(() => import("./pages/ministry/Users"));
const MinistryExport = lazy(() => import("./pages/ministry/Export"));

// Shared
const PlaceholderPage = lazy(() => import("./components/PlaceholderPage"));

// Legacy Admin Pages (will be used under ministry) - Lazy loaded
const AdminSubmissions = lazy(() => import("./pages/admin/Submissions"));
const AdminAnnouncements = lazy(() => import("./pages/admin/Announcements"));
const AdminDocuments = lazy(() => import("./pages/admin/Documents"));
const AdminDeadlines = lazy(() => import("./pages/admin/Deadlines"));
const ManageSchools = lazy(() => import("./pages/admin/ManageSchools"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 mins
      gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data for 10 mins
      retry: 1, // Retry failed queries once
      refetchOnWindowFocus: false, // Don't refetch when user refocuses window
      refetchOnReconnect: true, // Do refetch when network reconnects
    },
    mutations: {
      retry: 1,
    },
  },
});

type AllowedTier = 'school' | 'district' | 'province' | 'ministry';

/**
 * ProtectedRoute: Checks authentication, user role/tier, and verification status
 * If user is not verified and not in demo mode, redirects to /pending-verification
 */
function ProtectedRoute({ children, allowedTier }: { children: React.ReactNode; allowedTier: AllowedTier }) {
  const { user, role, loading, roleTier, isDemoMode, profileLoading } = useAuth();
  const verification = useVerification();

  // Show spinner while auth OR profile is loading
  if (loading || profileLoading) {
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

  // Verification check: only redirect for setup, not lock users out entirely
  // Users with pending/rejected status can still see their dashboard with limited access
  if (!isDemoMode && verification.needsSetup) {
    return <Navigate to="/setup-profile" replace />;
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
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/pending-verification" element={<Suspense fallback={<LoadingFallback />}><PendingVerification /></Suspense>} />
      <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPassword /></Suspense>} />
      <Route path="/afghanistan-info" element={<AfghanistanInfoPage />} />

      {/* Demo Mode - Choose role and see dashboards without auth */}
      <Route path="/demo" element={<Suspense fallback={<LoadingFallback />}><Demo /></Suspense>} />

      {/* Test Buttons Page - Test all functionality */}
      {import.meta.env.MODE === 'development' && (
        <Route path="/test-buttons" element={<Suspense fallback={<LoadingFallback />}><TestButtons /></Suspense>} />
      )}

      {/* Legacy admin redirect */}
      <Route path="/admin/*" element={<Navigate to="/ministry" replace />} />

      {/* School Routes (teacher & principal) */}
      <Route path="/school" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><Suspense fallback={<LoadingFallback />}><SchoolDashboard /></Suspense></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/statistics" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><Suspense fallback={<LoadingFallback />}><SubmitStatistics /></Suspense></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/reports" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><Suspense fallback={<LoadingFallback />}><SubmitReports /></Suspense></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/forms" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><Suspense fallback={<LoadingFallback />}><SubmitForms /></Suspense></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/announcements" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><Suspense fallback={<LoadingFallback />}><SchoolAnnouncements /></Suspense></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/documents" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><Suspense fallback={<LoadingFallback />}><SchoolDocuments /></Suspense></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/deadlines" element={
        <ProtectedRoute allowedTier="school">
          <SchoolLayout><Suspense fallback={<LoadingFallback />}><SchoolDeadlines /></Suspense></SchoolLayout>
        </ProtectedRoute>
      } />

      {/* District Routes */}
      <Route path="/district" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><Suspense fallback={<LoadingFallback />}><DistrictDashboard /></Suspense></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/submissions" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><Suspense fallback={<LoadingFallback />}><DistrictSubmissions /></Suspense></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/verify" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><Suspense fallback={<LoadingFallback />}><DistrictVerifyData /></Suspense></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/schools" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><Suspense fallback={<LoadingFallback />}><DistrictSchools /></Suspense></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/announcements" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><Suspense fallback={<LoadingFallback />}><SchoolAnnouncements /></Suspense></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/documents" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><Suspense fallback={<LoadingFallback />}><SchoolDocuments /></Suspense></DistrictLayout>
        </ProtectedRoute>
      } />
      <Route path="/district/deadlines" element={
        <ProtectedRoute allowedTier="district">
          <DistrictLayout><Suspense fallback={<LoadingFallback />}><SchoolDeadlines /></Suspense></DistrictLayout>
        </ProtectedRoute>
      } />

      {/* Province Routes */}
      <Route path="/province" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><Suspense fallback={<LoadingFallback />}><ProvinceDashboard /></Suspense></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/districts" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><Suspense fallback={<LoadingFallback />}><PlaceholderPage title="Districts" description="View and manage districts in your province" /></Suspense></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/analytics" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><Suspense fallback={<LoadingFallback />}><PlaceholderPage title="Analytics" description="Province-level analytics and trend data" /></Suspense></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/submissions" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><Suspense fallback={<LoadingFallback />}><PlaceholderPage title="Submissions" description="View aggregated submissions from all districts" /></Suspense></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/announcements" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><Suspense fallback={<LoadingFallback />}><SchoolAnnouncements /></Suspense></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/documents" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><Suspense fallback={<LoadingFallback />}><SchoolDocuments /></Suspense></ProvinceLayout>
        </ProtectedRoute>
      } />
      <Route path="/province/deadlines" element={
        <ProtectedRoute allowedTier="province">
          <ProvinceLayout><Suspense fallback={<LoadingFallback />}><SchoolDeadlines /></Suspense></ProvinceLayout>
        </ProtectedRoute>
      } />

      {/* Ministry Routes */}
      <Route path="/ministry" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><MinistryDashboard /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/analytics" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><PlaceholderPage title="National Analytics" description="Nation-wide data analysis and trends" /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/provinces" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><PlaceholderPage title="Provinces" description="View all 34 provinces and their data" /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/submissions" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><AdminSubmissions /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/announcements" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><AdminAnnouncements /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/documents" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><AdminDocuments /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/deadlines" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><AdminDeadlines /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/users" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><PlaceholderPage title="Manage Users" description="Create and manage user accounts for all levels" /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/schools" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><ManageSchools /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />
      <Route path="/ministry/export" element={
        <ProtectedRoute allowedTier="ministry">
          <MinistryLayout><Suspense fallback={<LoadingFallback />}><PlaceholderPage title="Export Reports" description="Generate and download national reports in Excel and PDF" /></Suspense></MinistryLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <ConfirmationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SmartConfirmationDialog />
            {import.meta.env.DEV && <ErrorSimulationPanel />}

            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>

          </TooltipProvider>
        </ConfirmationProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
export default App;