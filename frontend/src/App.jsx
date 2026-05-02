import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EquipmentsPage from './pages/EquipmentsPage'
import ClientsPage from './pages/ClientsPage'
import RentalsPage from './pages/RentalsPage'
import NewRentalPage from './pages/NewRentalPage'
import EditRentalPage from './pages/EditRentalPage'
import FinancialPage from './pages/FinancialPage'
import DeliveriesPage from './pages/DeliveriesPage'
import ReportPage from './pages/ReportPage'
import AlertsPage from './pages/AlertsPage'
import UsersPage from './pages/UsersPage'
import WhatsAppPage from './pages/WhatsAppPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="equipments" element={<EquipmentsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="rentals" element={<RentalsPage />} />
            <Route path="rentals/new" element={<NewRentalPage />} />
            <Route path="rentals/:id/edit" element={<EditRentalPage />} />
            <Route path="financial" element={<FinancialPage />} />
            <Route path="deliveries" element={<DeliveriesPage />} />
            <Route path="reports" element={<ReportPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="whatsapp" element={<WhatsAppPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
