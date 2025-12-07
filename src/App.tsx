import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import LoginPage from '@/pages/LoginPage'
import { RoutingPage } from '@/pages/RoutingPage'
import ProfilePage from '@/pages/ProfilePage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapContainerPage } from '@/pages/MapContainerPage'
import { AdminPage } from '@/pages/AdminPage'
import PrioritiesPage from '@/pages/PrioritiesPage'
import { RegisterPage } from '@/pages/RegisterPage'
// Import your other pages (MapPage, AdminPage, etc.)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
})
function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/routing" element={<RoutingPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/map" element={<MapContainerPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/priorities" element={<PrioritiesPage />} />
            </Route>
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </QueryClientProvider>

    </BrowserRouter>
  )
}

export default App