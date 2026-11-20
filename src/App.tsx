import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReportsProvider } from './context/ReportsContext';
import { CommunityNeedsProvider } from './context/CommunityNeedsContext';
import { VerificationProvider } from './context/VerificationContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { OversightDashboard } from './pages/OversightDashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { CommunityNeedsPage } from './pages/CommunityNeedsPage';
import { CitizenReportsPage } from './pages/CitizenReportsPage';
import { CitizenDashboard, ReportProjectIssuePage, ReportCommunityNeedPage, MyReportsPage } from './pages/CitizenDashboard';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  
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
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
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
                
                <Route element={
                  <ProtectedRoute allowedRoles={['oversight']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<OversightDashboard />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/community-needs" element={<CommunityNeedsPage />} />
                  <Route path="/citizen-reports" element={<CitizenReportsPage />} />
                  <Route path="/add-project" element={<OversightDashboard />} />
                </Route>

                <Route element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
                  <Route path="/citizen/projects" element={<CitizenDashboard />} />
                  <Route path="/citizen/report-issue" element={<ReportProjectIssuePage />} />
                  <Route path="/citizen/report-need" element={<ReportCommunityNeedPage />} />
                  <Route path="/citizen/my-reports" element={<MyReportsPage />} />
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </VerificationProvider>
        </CommunityNeedsProvider>
      </ReportsProvider>
    </AuthProvider>
  );
}

export default App;