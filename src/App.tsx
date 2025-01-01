import { Route, Routes } from "react-router";
import { AdminPage, MapContainerPage, RoutingPage } from "./pages";
const App = () => {
  return (
    <Routes>
    <Route path="/" element={<RoutingPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/map" element={<MapContainerPage />} />
  </Routes>
  )
}

export default App