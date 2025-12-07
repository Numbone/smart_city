import "leaflet/dist/leaflet.css";
import { createRoot } from 'react-dom/client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import 'react-leaflet-markercluster/styles';
import App from "./App";
import './index.css';
createRoot(document.getElementById('root')!).render(

    <App />

)
