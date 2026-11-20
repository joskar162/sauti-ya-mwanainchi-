import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReportsProvider } from './context/ReportsContext';
import { CommunityNeedsProvider } from './context/CommunityNeedsContext';
import { VerificationProvider } from './context/VerificationContext';
import { ProjectsProvider } from './context/ProjectsContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { OversightDashboard } from './pages/OversightDashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { CommunityNeedsPage } from './pages/CommunityNeedsPage';
import { CitizenReportsPage } from './pages/CitizenReportsPage';
import { CitizenDashboard, MyReportsPage } from './pages/CitizenDashboard';
import { SubmitLaunchedProjectPage, SubmitProjectUpdatePage } from './pages/CitizenProjectReports';
import { AddProjectPage } from './pages/AddProjectPage';
import { AdminPage } from './pages/AdminPage';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading your session…</div>;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading your session…</div>;
  
  if (isAuthenticated) {
    const destination = user?.role === 'citizen'
      ? '/citizen-dashboard'
      : user?.role === 'admin'
        ? '/admin'
        : '/dashboard';
    return <Navigate to={destination} replace />;
  }
  
  return <>{children}</>;
};

const HomeRoute = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading your session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'citizen') return <Navigate to="/citizen-dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AdminEntry = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading your session…</div>;
  if (user && user.role !== 'admin') {
    return <Navigate to={user.role === 'citizen' ? '/citizen-dashboard' : '/dashboard'} replace />;
  }
  return <AdminPage />;
};

function App() {
  return (
    <ProjectsProvider>
      <AuthProvider>
        <ReportsProvider>
          <CommunityNeedsProvider>
            <VerificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path="/admin" element={<AdminEntry />} />
                
                <Route element={
                  <ProtectedRoute allowedRoles={['oversight']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<OversightDashboard />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/community-needs" element={<CommunityNeedsPage />} />
                  <Route path="/citizen-reports" element={<CitizenReportsPage />} />
                  <Route path="/add-project" element={<AddProjectPage />} />
                </Route>

                <Route element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
                  <Route path="/citizen/projects" element={<CitizenDashboard />} />
                  <Route path="/citizen/report-launched-project" element={<SubmitLaunchedProjectPage />} />
                  <Route path="/citizen/report-project-update" element={<SubmitProjectUpdatePage />} />
                  <Route path="/citizen/my-reports" element={<MyReportsPage />} />
                </Route>

                <Route path="/" element={<HomeRoute />} />
                <Route path="*" element={<HomeRoute />} />
              </Routes>
            </BrowserRouter>
            </VerificationProvider>
          </CommunityNeedsProvider>
        </ReportsProvider>
      </AuthProvider>
    </ProjectsProvider>
  );
}

export default App;