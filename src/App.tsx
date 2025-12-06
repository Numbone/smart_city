import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { Route, Routes } from "react-router";
import { AdminPage, MapContainerPage, RoutingPage } from "./pages";
import LoginPage from "./pages/LoginPage";
const queryClient = new QueryClient()
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/routing" element={<RoutingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/map" element={<MapContainerPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </QueryClientProvider>
  )
}

export default App