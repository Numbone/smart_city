import { ILightingObject } from "@/types/lighting.interface";
import { useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
 
export   const TableContainer=()=> {
 const [lightingObjects] = useState<
             ILightingObject[]
         >([
             { id: 1, name: "Светильник 1", coords: [51.1655, 71.4272], status: "on", code: "12345" },
             { id: 2, name: "Светильник 2", coords: [51.1656, 71.4275], status: "off", code: "67890" },
             { id: 3, name: "Светильник 3", coords: [51.1657, 71.4280], status: "fault", code: "54321" },
             { id: 4, name: "Светильник 4", coords: [51.1658, 71.4285], status: "on", code: "09876" },
             { id: 5, name: "Светильник 5", coords: [51.1659, 71.4290], status: "off", code: "22131" },
             { id: 6, name: "Светильник 6", coords: [51.1660, 71.4295], status: "on", code: "22132" },
             { id: 7, name: "Светильник 7", coords: [51.1661, 71.4300], status: "off", code: "22133" },
             { id: 8, name: "Светильник 8", coords: [51.1662, 71.4305], status: "fault", code: "22134" },
             { id: 9, name: "Светильник 9", coords: [51.1663, 71.4310], status: "on", code: "22135" },
             { id: 10, name: "Светильник 10", coords: [51.1764, 71.4315], status: "off", code: "22136" },
             { id: 11, name: "Светильник 11", coords: [51.1765, 71.4320], status: "on", code: "22137" },
             { id: 12, name: "Светильник 12", coords: [51.1766, 71.4325], status: "off", code: "22138" },
             { id: 13, name: "Светильник 13", coords: [51.1767, 71.4330], status: "on", code: "22139" },
             { id: 14, name: "Светильник 14", coords: [51.1768, 71.4335], status: "fault", code: "221310" },
             { id: 15, name: "Светильник 15", coords: [51.1769, 71.4340], status: "on", code: "2213101" },
             { id: 16, name: "Светильник 16", coords: [51.1770, 71.4345], status: "off", code: "221312" },
             { id: 17, name: "Светильник 17", coords: [51.1771, 71.4350], status: "on", code: "221313" },
             { id: 18, name: "Светильник 18", coords: [51.1772, 71.4355], status: "off", code: "221314" },
             { id: 19, name: "Светильник 19", coords: [51.1773, 71.4360], status: "on", code: "221315" },
             { id: 20, name: "Светильник 20", coords: [51.1774, 71.4365], status: "off", code: "221322" },
             { id: 21, name: "Светильник 21", coords: [51.1775, 71.4370], status: "on", code: "221355" },
             { id: 22, name: "Светильник 22", coords: [51.17, 71.4375], status: "off", code: "221344" },
             { id: 23, name: "Светильник 23", coords: [51.1777, 71.4380], status: "on", code: "221366" },
         ]);
 
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={lightingObjects} />
    </div>
  )
}