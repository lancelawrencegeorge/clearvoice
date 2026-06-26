import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Guide from './pages/Guide';
import BillingDashboard from './pages/BillingDashboard';
import InviteAgent from './pages/InviteAgent';
import Onboarding from './pages/Onboarding';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Landing from './pages/Landing';
import BulkImport from './pages/BulkImport';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
// Add page imports here


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/billing" element={<BillingDashboard />} />
              <Route path="/invite" element={<InviteAgent />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/bulk-import" element={<BulkImport />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="*" element={<PageNotFound />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App