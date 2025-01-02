import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { divIcon } from "leaflet";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import AddIcon from "@/assets/add.svg";
import BackIcon from "@/assets/back.svg";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
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

interface ILightingObject {
    id: number;
    code: string;
    name: string;
    coords: [number, number];
    status: "on" | "off" | "fault";
}
export const MapContainerPage = () => {
    const navigate =useNavigate();
    const [selectedLightingObject, setSelectedLightingObject] = useState<ILightingObject| null>(null)
    const [lightingObjects, setLightingObjects] = useState<
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
    const defaultValues: ILightingObject = {
        id: 0,
        name: "",
        coords: [51.1657, 71.4275],
        status: "on",
        code: "00000",
    }
    const form = useForm<ILightingObject>({
        defaultValues: defaultValues,
    });
    const { handleSubmit, control, register,reset } = form
    const [openSheet, setOpenSheet] = useState(false);
    
    const handleSheetOpen = () => {setOpenSheet(!openSheet); reset(defaultValues); };
    const onSubmit = (data: ILightingObject) => {
        if(selectedLightingObject?.id){
            const updatedLightingObjects = lightingObjects.map((obj) => {
                if (obj.id === data.id) {
                    return data;
                }
                return obj;
            })
            setLightingObjects(updatedLightingObjects)
        }else{
            setLightingObjects([...lightingObjects, data])
        }
        handleSheetOpen();
        setSelectedLightingObject(null);
    };
    useEffect(() => {
        if(selectedLightingObject?.id){
            reset(selectedLightingObject)
        }
    },[reset, selectedLightingObject])
    return (
        <div>
            <div className="absolute flex gap-4 p-4 rounded-2xl bg-white top-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-1/2">
            <Button onClick={()=>navigate(-1)} variant={"outline"} >
                <img src={BackIcon} alt="BackIcon" className="fill-lime-800" />
            </Button>
            <Button variant="default" onClick={() => {handleSheetOpen(); setSelectedLightingObject(null);}}>
            <img src={AddIcon} alt="AddIcon" className="fill-lime-800" /> Добавить светильник
            </Button>
            </div>
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
                    <Sheet  open={openSheet} onOpenChange={handleSheetOpen}>
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
                                    click: () => {
                                        setSelectedLightingObject(obj)
                                        handleSheetOpen();
                                    }
                                }}
                            >
                                <Popup className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        Наименование: <span className="font-normal">{obj.name}</span>
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Код:</strong> {obj.code}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Географические координаты:</strong> {obj.coords[0]} N, {obj.coords[1]} E
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Состояние:</strong> <span className={cn(obj.status === "on" && "text-green-600", obj.status === "off" && "text-red-600", obj.status === "fault" && "text-yellow-600")}>{obj.status}</span>
                                    </p>
                                </Popup>
                            </Marker>
                        ))}
                        <SheetContent className="z-[9999]">
                            <SheetHeader>
                                <SheetTitle>{
                                    selectedLightingObject ? "Редактирование светильника " + selectedLightingObject.id : "Создание светильника"}</SheetTitle>
                                <SheetDescription>

                                </SheetDescription>
                            </SheetHeader>
                            <Form {...form}>
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className="flex flex-col flex-1 gap-4 py-4">
                                        <div className="flex items-center gap-4">
                                            <Label className="text-right">
                                                Наименование
                                            </Label>
                                            <Input {...register("name")} className="col-span-3" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Label className="text-right">
                                                Код
                                            </Label>
                                            <Input {...register("code")} className="col-span-3" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Label className="text-right">
                                                Географические координаты широта
                                            </Label>
                                            <Input {...register("coords.0")} className="col-span-3" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Label className="text-right">
                                                Географические координаты долгота
                                            </Label>
                                            <Input {...register("coords.1")} className="col-span-3" />
                                        </div>
                                        <div className="flex items-center gap-4 z-[999999]">
                                            <Label className="text-right">Status</Label>
                                            <FormField
                                                control={control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select form="status"  onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Выбрать состояние" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="z-[999999]">
                                                                <SelectGroup>
                                                                    <SelectItem value="on">Включить</SelectItem>
                                                                    <SelectItem value="off">Выключить</SelectItem>
                                                                    <SelectItem value="fault">Неисправен</SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button type="submit">Сохранить</Button>
                                    </div>
                                </form>
                            </Form>
                        </SheetContent>
                    </Sheet>
                </MarkerClusterGroup>
            </MapContainer>

        </div>

    )
}

