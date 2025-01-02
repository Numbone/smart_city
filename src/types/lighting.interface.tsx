export interface ILightingObject {
    id: number;
    code: string;
    name: string;
    coords: [number, number];
    status: "on" | "off" | "fault";
}