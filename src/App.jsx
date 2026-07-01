import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ITSupport from './pages/ITSupport';
import Onboarding from './pages/Onboarding';
import Guide from './pages/Guide';
import RegisterAgent from './pages/InviteAgent';
import BulkImport from './pages/BulkImport';
import Invoices from './pages/Invoices';
import EmailTemplates from './pages/EmailTemplates';
import Contact from './pages/Contact';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/it-support" element={<ITSupport />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/register" element={<RegisterAgent />} />
              <Route path="/bulk-import" element={<BulkImport />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/email-templates" element={<EmailTemplates />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App