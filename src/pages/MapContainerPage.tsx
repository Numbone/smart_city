import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet";
import { getAllWaters, IWater, waterService } from "@/shared/api/waters";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { divIcon } from "leaflet";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useNavigate } from "react-router-dom";

const getCustomIcon = (resourceType: "lake" | "reservoir" | "channel", waterType: "fresh" | "salty", priorityLevel: "high" | "medium" | "low") => {
    const color = waterType === "fresh" ? "#3b82f6" : "#0891b2"; // синий для пресной, бирюзовый для соленой
    
    // Цвет рамки в зависимости от приоритета
    const borderColor = priorityLevel === "high" ? "#ef4444" : priorityLevel === "medium" ? "#f59e0b" : "#22c55e";
    
    let iconSvg = "";
    
    if (resourceType === "lake") {
        // Иконка озера (капля воды)
        iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
        `;
    } else if (resourceType === "reservoir") {
        // Иконка водохранилища (контейнер с водой)
        iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
                <rect x="3" y="6" width="18" height="14" rx="2"/>
                <path d="M3 10h18" stroke="${color}" fill="none"/>
            </svg>
        `;
    } else if (resourceType === "channel") {
        // Иконка реки/канала (волны)
        iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
                <path d="M2 12c.6-2.5 2-3 3.5-3s2.9.5 3.5 3c.6 2.5 2 3 3.5 3s2.9-.5 3.5-3c.6-2.5 2-3 3.5-3s2.9.5 3.5 3"/>
                <path d="M2 18c.6-2.5 2-3 3.5-3s2.9.5 3.5 3c.6 2.5 2 3 3.5 3s2.9-.5 3.5-3c.6-2.5 2-3 3.5-3s2.9.5 3.5 3"/>
            </svg>
        `;
    }
    
    return divIcon({
        className: "custom-water-icon",
        html: `
            <div style="
                background: white;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                border: 3px solid ${borderColor};
                position: relative;
            ">
                ${iconSvg}
                ${priorityLevel === "high" ? `
                    <div style="
                        position: absolute;
                        top: -4px;
                        right: -4px;
                        background: ${borderColor};
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        border: 2px solid white;
                    "></div>
                ` : ""}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

const getTechnicalConditionColor = (technicalCondition: number): string => {
    switch (technicalCondition) {
        case 1: return "border-green-600";
        case 2: return "border-lime-500";
        case 3: return "border-yellow-500";
        case 4: return "border-orange-500";
        case 5: return "border-red-600";
        default: return "border-gray-400";
      }
};

// Функция расчёта приоритета
const calculatePriorityScore = (technicalCondition: number, passportDate: string): number => {
    const passportYear = new Date(passportDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const passportAge = currentYear - passportYear;
    
    // PriorityScore = (6 - состояние) * 3 + возраст паспорта в годах
    const score = (6 - technicalCondition) * 3 + passportAge;
    return score;
};

// Функция определения уровня приоритета
const getPriorityLevel = (score: number): "high" | "medium" | "low" => {
    if (score >= 12) return "high";
    if (score >= 6) return "medium";
    return "low";
};

// Функция получения текста уровня приоритета
const getPriorityLevelText = (level: "high" | "medium" | "low"): string => {
    switch(level) {
        case "high": return "Высокий";
        case "medium": return "Средний";
        case "low": return "Низкий";
    }
};

// Функция получения цвета уровня приоритета
const getPriorityColor = (level: "high" | "medium" | "low"): string => {
    switch(level) {
        case "high": return "#ef4444";
        case "medium": return "#f59e0b";
        case "low": return "#22c55e";
    }
};

export const MapContainerPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedWater, setSelectedWater] = useState<IWater | null>(null)
    const [page, setPage] = useState(0);
    const [limit] = useState(50);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState("priority");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
    const [region, setRegion] = useState("");
    const [resource_type, setResourceType] = useState("");
    const [water_type, setWaterType] = useState("");
    const [fauna, setFauna] = useState<boolean | undefined>(undefined);
    const [passport_date_from, setPassportDateFrom] = useState("");
    const [passport_date_to, setPassportDateTo] = useState("");
    const [technical_condition_from, setTechnicalConditionFrom] = useState<number | undefined>(undefined);
    const [technical_condition_to, setTechnicalConditionTo] = useState<number | undefined>(undefined);
    
    // Состояния для UI
    const [openFilterSheet, setOpenFilterSheet] = useState(false);
    const [openSortSheet, setOpenSortSheet] = useState(false);
    const [openSearchSheet, setOpenSearchSheet] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    
    const { data: waters, isLoading } = useQuery({
        queryKey: ['waters', page, limit, search, sortField, sortOrder, region, resource_type, water_type, fauna, passport_date_from, passport_date_to, technical_condition_from, technical_condition_to],
        queryFn: () => getAllWaters({
            page,
            limit,
            search,
            sortField,
            sortOrder,
            region,
            resource_type,
            water_type,
            fauna,
            passport_date_from,
            passport_date_to,
            technical_condition_from,
            technical_condition_to,
        }),
    })
    
    const defaultValues: IWater = {
        id: 0,
        name: "",
        latitude: 0,
        longitude: 0,
        water_type: "",
        resource_type: "",
        fauna: false,
        passport_date: "",
        technical_condition: 0,
        priority: 0,
        region: "",
    }
    
    const form = useForm<IWater>({
        defaultValues: defaultValues,
    });
    const { handleSubmit, control, register, reset } = form
    const [openSheet, setOpenSheet] = useState(false);

    const handleSheetOpen = () => { 
        setOpenSheet(!openSheet); 
        if (!openSheet) {
            reset(selectedWater || defaultValues);
        } else {
            reset(defaultValues);
        }
    };
    
    const onSubmit = async (data: IWater) => {
        if (selectedWater?.id) {
            await waterService.updateWater(selectedWater.id, data)
        } else {
            await waterService.createWater(data)
        }
        queryClient.invalidateQueries({ queryKey: ['waters'] })
        handleSheetOpen();
        setSelectedWater(null);
    }

    useEffect(() => {
        if (selectedWater) {
            form.reset(selectedWater);
        }
    }, [selectedWater]);

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(0);
        setOpenSearchSheet(false);
    };

    const handleResetFilters = () => {
        setRegion("");
        setResourceType("");
        setWaterType("");
        setFauna(undefined);
        setPassportDateFrom("");
        setPassportDateTo("");
        setTechnicalConditionFrom(undefined);
        setTechnicalConditionTo(undefined);
        setPage(0);
    };

    const handleApplyFilters = () => {
        setPage(0);
        setOpenFilterSheet(false);
    };

    const handleApplySort = () => {
        setPage(0);
        setOpenSortSheet(false);
    };

    const activeFiltersCount = [
        region,
        resource_type,
        water_type,
        fauna,
        passport_date_from,
        passport_date_to,
        technical_condition_from,
        technical_condition_to,
    ].filter(Boolean).length;

    return (
        <div>
            <div className="absolute flex gap-2 p-4 rounded-2xl bg-white top-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] shadow-lg">
                <Button onClick={() => navigate(-1)} variant={"outline"} size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                </Button>
                <Button variant={activeFiltersCount > 0 ? "default" : "outline"} size="icon" onClick={() => setOpenFilterSheet(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5H2"/><path d="M6 12h12"/><path d="M9 19h6"/></svg>
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </Button>
                <Button variant="outline" size="icon" onClick={() => setOpenSortSheet(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                </Button>
                <Button variant={search ? "default" : "outline"} size="icon" onClick={() => setOpenSearchSheet(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                </Button>
                <div className="ml-2 text-sm text-gray-600 flex items-center px-3 bg-gray-100 rounded-lg">
                    {isLoading ? "Загрузка..." : `Показано: ${waters?.data?.length || 0}`}
                </div>
            </div>

            {/* Легенда приоритетов */}
            <div className="absolute bottom-10 left-10 z-[9999] bg-white p-4 rounded-lg shadow-lg">
                <h4 className="font-semibold text-sm mb-2">Приоритет обследования</h4>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#ef4444" }}></div>
                        <span className="text-xs">Высокий (≥12)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f59e0b" }}></div>
                        <span className="text-xs">Средний (6-11)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#22c55e" }}></div>
                        <span className="text-xs">Низкий (&lt;6)</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 border-t pt-2">
                    Score = (6 - состояние) × 3 + возраст паспорта
                </p>
            </div>

            <MapContainer
                center={[48.0196, 66.9237]}
                zoom={5}
                scrollWheelZoom={true}
                style={{ minHeight: "100vh", minWidth: "100vw" }}
                className="markercluster-map"
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarkerClusterGroup>
                    {waters?.data?.map((obj) => {
                        const priorityScore = calculatePriorityScore(obj.technical_condition, obj.passport_date);
                        const priorityLevel = getPriorityLevel(priorityScore);
                        
                        return (
                        <Marker
                            key={obj.id}
                            position={[obj.latitude, obj.longitude]}
                            icon={getCustomIcon(
                                obj.resource_type as "lake" | "reservoir" | "channel", 
                                obj.water_type as "fresh" | "salty",
                                priorityLevel
                            )}
                            eventHandlers={{
                                mouseover: (e) => e.target.openPopup(),
                                mouseout: (e) => e.target.closePopup(),
                                click: () => {
                                    setSelectedWater(obj)
                                    setOpenSheet(true);
                                }
                            }}
                        >
                            <Popup className="p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    {obj.name}
                                </h3>
                                <div className="mb-3 p-2 rounded" style={{ backgroundColor: `${getPriorityColor(priorityLevel)}15`, border: `1px solid ${getPriorityColor(priorityLevel)}` }}>
                                    <p className="text-sm font-semibold" style={{ color: getPriorityColor(priorityLevel) }}>
                                        Приоритет: {getPriorityLevelText(priorityLevel)} (Score: {priorityScore})
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Расчёт: (6 - {obj.technical_condition}) × 3 + {new Date().getFullYear() - new Date(obj.passport_date).getFullYear()} лет = {priorityScore}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>Регион:</strong> {obj.region}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>Координаты:</strong> {obj.latitude.toFixed(4)} N, {obj.longitude.toFixed(4)} E
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>Тип:</strong> {obj.resource_type}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>Техническое состояние:</strong> {obj.technical_condition}/5
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>Дата паспорта:</strong> {obj.passport_date} ({new Date().getFullYear() - new Date(obj.passport_date).getFullYear()} лет)
                                </p>
                            </Popup>
                        </Marker>
                        );
                    })}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Sheet для создания/редактирования */}
            <Sheet  open={openSheet} onOpenChange={handleSheetOpen}>
                <SheetContent className={clsx("z-[9999] overflow-y-auto border border-4",
                    getTechnicalConditionColor(selectedWater?.technical_condition || 0)
                )   }>
                    <SheetHeader>
                        <SheetTitle>
                            {selectedWater ? "Информация о водном объекте" : "Создание водного объекта"}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedWater ? "Просмотр данных водного объекта" : "Заполните информацию о новом водном объекте"}
                        </SheetDescription>
                    </SheetHeader>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Наименование</Label>
                                    <Input {...register("name")} disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Регион</Label>
                                    <Input {...register("region")} disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Широта</Label>
                                    <Input {...register("latitude", { valueAsNumber: true })} type="number" step="any" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Долгота</Label>
                                    <Input {...register("longitude", { valueAsNumber: true })} type="number" step="any" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Тип воды</Label>
                                    <FormField
                                        control={control}
                                        name="water_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedWater}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Выбрать тип воды" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="fresh">Пресная</SelectItem>
                                                            <SelectItem value="salty">Соленая</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Тип ресурса</Label>
                                    <FormField
                                        control={control}
                                        name="resource_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedWater}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Выбрать тип ресурса" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="lake">Озеро</SelectItem>
                                                            <SelectItem value="reservoir">Водохранилище</SelectItem>
                                                            <SelectItem value="channel">Река/Канал</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Приоритет</Label>
                                    <Input {...register("priority", { valueAsNumber: true })} type="number" step="1" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Дата паспорта</Label>
                                    <Input {...register("passport_date")} type="date" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Техническое состояние</Label>
                                    <Input {...register("technical_condition", { valueAsNumber: true })} type="number" step="1" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Фауна</Label>
                                    <FormField
                                        control={control}
                                        name="fauna"
                                        render={({ field }) => (
                                            <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value.toString()} disabled={!!selectedWater}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выбрать фауну" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Есть</SelectItem>
                                            <SelectItem value="false">Нет</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>PDF</Label>
                                    <Input {...register("pdf_url")} type="text" disabled={!!selectedWater} />
                                </div>
                                {!selectedWater && (
                                    <Button type="submit">Создать</Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>

            {/* Sheet для поиска */}
            <Sheet open={openSearchSheet} onOpenChange={setOpenSearchSheet}>
                <SheetContent className="z-[9999]">
                    <SheetHeader>
                        <SheetTitle>Поиск</SheetTitle>
                        <SheetDescription>Введите название водного объекта</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Input
                            placeholder="Название..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSearch} className="flex-1">Найти</Button>
                            <Button variant="outline" onClick={() => { setSearch(""); setSearchInput(""); setPage(0); }} className="flex-1">
                                Сбросить
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Sheet для фильтров */}
            <Sheet open={openFilterSheet} onOpenChange={setOpenFilterSheet}>
                <SheetContent className="z-[9999] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Фильтры</SheetTitle>
                        <SheetDescription>
                            Настройте параметры фильтрации {activeFiltersCount > 0 && `(активно: ${activeFiltersCount})`}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Регион</Label>
                            <Select value={region || "all"} onValueChange={(val) => setRegion(val === "all" ? "" : val)} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Все регионы" />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">Все регионы</SelectItem>
                                    <SelectItem value="Акмолинская область">Акмолинская область</SelectItem>
                                    <SelectItem value="Алматинская область">Алматинская область</SelectItem>
                                    <SelectItem value="Атырауская область">Атырауская область</SelectItem>
                                    <SelectItem value="Восточно-Казахстанская область">Восточно-Казахстанская область</SelectItem>
                                    <SelectItem value="Жамбылская область">Жамбылская область</SelectItem>
                                    <SelectItem value="Западно-Казахстанская область">Западно-Казахстанская область</SelectItem>
                                    <SelectItem value="Карагандинская область">Карагандинская область</SelectItem>
                                    <SelectItem value="Костанайская область">Костанайская область</SelectItem>
                                    <SelectItem value="Кызылординская область">Кызылординская область</SelectItem>
                                    <SelectItem value="Павлодарская область">Павлодарская область</SelectItem>
                                    <SelectItem value="Туркестанская область">Туркестанская область</SelectItem>
                                    <SelectItem value="Актюбинская область">Актюбинская область</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Тип ресурса</Label>
                            <Select value={resource_type || "all"} onValueChange={(val) => setResourceType(val === "all" ? "" : val)} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Все типы" />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">Все типы</SelectItem>
                                    <SelectItem value="lake">Озеро</SelectItem>
                                    <SelectItem value="reservoir">Водохранилище</SelectItem>
                                    <SelectItem value="channel">Река/Канал</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Тип воды</Label>
                            <Select value={water_type || "all"} onValueChange={(val) => setWaterType(val === "all" ? "" : val)} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Все типы воды" />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">Все типы воды</SelectItem>
                                    <SelectItem value="fresh">Пресная</SelectItem>
                                    <SelectItem value="salty">Соленая</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Фауна</Label>
                            <Select value={fauna === undefined ? "all" : fauna.toString()} onValueChange={(val) => setFauna(val === "all" ? undefined : val === "true")} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Не важно" />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">Не важно</SelectItem>
                                    <SelectItem value="true">Есть</SelectItem>
                                    <SelectItem value="false">Нет</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleApplyFilters} className="flex-1">Применить</Button>
                            <Button variant="outline" onClick={handleResetFilters} className="flex-1">Сбросить</Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Sheet для сортировки */}
            <Sheet open={openSortSheet} onOpenChange={setOpenSortSheet}>
                <SheetContent className="z-[9999]">
                    <SheetHeader>
                        <SheetTitle>Сортировка</SheetTitle>
                        <SheetDescription>Выберите поле и порядок сортировки</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Поле сортировки</Label>
                            <Select value={sortField} onValueChange={setSortField} defaultValue="priority">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="priority">Приоритет</SelectItem>
                                    <SelectItem value="name">Название</SelectItem>
                                    <SelectItem value="region">Регион</SelectItem>
                                    <SelectItem value="technical_condition">Техническое состояние</SelectItem>
                                    <SelectItem value="passport_date">Дата паспорта</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Порядок</Label>
                            <Select value={sortOrder} onValueChange={(val: "ASC" | "DESC") => setSortOrder(val)} defaultValue="DESC">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="ASC">По возрастанию</SelectItem>
                                    <SelectItem value="DESC">По убыванию</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleApplySort}>Применить</Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}