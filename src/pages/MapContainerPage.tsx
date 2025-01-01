import { cn } from "@/lib/utils";
import { divIcon } from "leaflet";
import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

const getCustomIcon = (status: "on" | "off" | "fault") =>
    divIcon({
        className: "custom-icon",
        html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="${status === "on" ? "green" : status === "off" ? "red" : "orange"
            }" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flashlight">
        <path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z"/>
        <line x1="6" x2="18" y1="6" y2="6"/>
        <line x1="12" x2="12" y1="12" y2="12"/>
      </svg>
    `,
        iconSize: [24, 24],
        iconAnchor: [15, 24],
        popupAnchor: [0, -28],
    });
export const MapContainerPage = () => {
    const [lightingObjects] = useState<
        { id: number; name: string; coords: [number, number]; status: "on" | "off" | "fault" }[]
    >([
        { id: 1, name: "Светильник 1", coords: [51.1655, 71.4272], status: "on" },
        { id: 2, name: "Светильник 2", coords: [51.1656, 71.4275], status: "off" },
        { id: 3, name: "Светильник 3", coords: [51.1657, 71.4280], status: "fault" },
        { id: 4, name: "Светильник 4", coords: [51.1658, 71.4285], status: "on" },
        { id: 5, name: "Светильник 5", coords: [51.1659, 71.4290], status: "off" },
        { id: 6, name: "Светильник 6", coords: [51.1660, 71.4295], status: "on" },
        { id: 7, name: "Светильник 7", coords: [51.1661, 71.4300], status: "off" },
        { id: 8, name: "Светильник 8", coords: [51.1662, 71.4305], status: "fault" },
        { id: 9, name: "Светильник 9", coords: [51.1663, 71.4310], status: "on" },
        { id: 10, name: "Светильник 10", coords: [51.1764, 71.4315], status: "off" },
        { id: 11, name: "Светильник 11", coords: [51.1765, 71.4320], status: "on" },
        { id: 12, name: "Светильник 12", coords: [51.1766, 71.4325], status: "off" },
        { id: 13, name: "Светильник 13", coords: [51.1767, 71.4330], status: "on" },
        { id: 14, name: "Светильник 14", coords: [51.1768, 71.4335], status: "fault" },
        { id: 15, name: "Светильник 15", coords: [51.1769, 71.4340], status: "on" },
        { id: 16, name: "Светильник 16", coords: [51.1770, 71.4345], status: "off" },
        { id: 17, name: "Светильник 17", coords: [51.1771, 71.4350], status: "on" },
        { id: 18, name: "Светильник 18", coords: [51.1772, 71.4355], status: "off" },
        { id: 19, name: "Светильник 19", coords: [51.1773, 71.4360], status: "on" },
        { id: 20, name: "Светильник 20", coords: [51.1774, 71.4365], status: "off" },
        { id: 21, name: "Светильник 21", coords: [51.1775, 71.4370], status: "on" },
        { id: 22, name: "Светильник 22", coords: [51.17, 71.4375], status: "off" },
        { id: 23, name: "Светильник 23", coords: [51.1777, 71.4380], status: "on" },
    ]);
    return (
        <div>
            <MapContainer
                center={lightingObjects[0].coords}
                zoom={13}
                scrollWheelZoom={true}
                style={{ minHeight: "100vh", minWidth: "100vw" }}
                className="markercluster-map"
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarkerClusterGroup>

                    {lightingObjects.map((obj) => (
                        <Marker
                            key={obj.id}
                            position={obj.coords}
                            icon={getCustomIcon(obj.status)}
                            eventHandlers={{
                                mouseover: (e) => {
                                    e.target.openPopup();
                                },
                                mouseout: (e) => {
                                    e.target.closePopup();
                                },
                            }}
                        >
                            <Popup className="p-4 bg-white rounded-lg shadow-md">
                                
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        Наименование: <span className="font-normal">{obj.name}</span>
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Код:</strong> {obj.id}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Географические координаты:</strong> {obj.coords[0]} N, {obj.coords[1]} E
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Состояние:</strong> <span className={cn(obj.status === "on" && "text-green-600", obj.status === "off" && "text-red-600", obj.status === "fault" && "text-yellow-600")}>{obj.status}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Измеряемые величины:</strong>
                                    </p>
                                    <ul className="list-disc pl-5 text-sm text-gray-600">
                                        <li>Уровень освещенности: 5000 лм</li>
                                        <li>Потребляемая мощность: 60 Вт</li>
                                        <li>Температура окружающей среды: -5°C</li>
                                        <li>Напряжение: 220 В</li>
                                        <li>Состояние датчика движения: Активен</li>
                                    </ul>
                               
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    )
}

