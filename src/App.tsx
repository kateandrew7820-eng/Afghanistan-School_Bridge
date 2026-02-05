import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// School Pages
import SchoolLayout from "./components/layouts/SchoolLayout";
import SchoolDashboard from "./pages/school/Dashboard";
import SubmitStatistics from "./pages/school/SubmitStatistics";
import SubmitReports from "./pages/school/SubmitReports";
import SubmitForms from "./pages/school/SubmitForms";
import SchoolAnnouncements from "./pages/school/Announcements";
import SchoolDocuments from "./pages/school/Documents";
import SchoolDeadlines from "./pages/school/Deadlines";

// Admin Pages
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSubmissions from "./pages/admin/Submissions";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminDocuments from "./pages/admin/Documents";
import AdminDeadlines from "./pages/admin/Deadlines";
import ManageSchools from "./pages/admin/ManageSchools";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'admin' | 'school' }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/school'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={user ? <Navigate to={role === 'admin' ? '/admin' : '/school'} replace /> : <Login />} />

      {/* School Routes */}
      <Route path="/school" element={
        <ProtectedRoute allowedRole="school">
          <SchoolLayout><SchoolDashboard /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/statistics" element={
        <ProtectedRoute allowedRole="school">
          <SchoolLayout><SubmitStatistics /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/reports" element={
        <ProtectedRoute allowedRole="school">
          <SchoolLayout><SubmitReports /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/forms" element={
        <ProtectedRoute allowedRole="school">
          <SchoolLayout><SubmitForms /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/announcements" element={
        <ProtectedRoute allowedRole="school">
          <SchoolLayout><SchoolAnnouncements /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/documents" element={
        <ProtectedRoute allowedRole="school">
          <SchoolLayout><SchoolDocuments /></SchoolLayout>
        </ProtectedRoute>
      } />
      <Route path="/school/deadlines" element={
        <ProtectedRoute allowedRole="school">
          <SchoolLayout><SchoolDeadlines /></SchoolLayout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/submissions" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><AdminSubmissions /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/announcements" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><AdminAnnouncements /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/documents" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><AdminDocuments /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/deadlines" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><AdminDeadlines /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/schools" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><ManageSchools /></AdminLayout>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
