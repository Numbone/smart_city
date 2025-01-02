import { createRoot } from 'react-dom/client';
import "leaflet/dist/leaflet.css";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import 'react-leaflet-markercluster/styles';
import './index.css';
import App from "./App";
import { BrowserRouter } from "react-router";
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
