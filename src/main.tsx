import "leaflet/dist/leaflet.css";
import { createRoot } from 'react-dom/client';
import 'react-leaflet-markercluster/styles';
import './index.css';
import App from "./App";
import { BrowserRouter } from "react-router";
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
