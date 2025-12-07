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
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation()
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
                    {isLoading ? t('priorities.loading') : `${t('priorities.shown')}: ${waters?.data?.length || 0}`}
                </div>
            </div>

            {/* Легенда приоритетов */}
            <div className="absolute bottom-10 left-10 z-[9999] bg-white p-4 rounded-lg shadow-lg">
                <h4 className="font-semibold text-sm mb-2">{t('priorities.priorityLegend')}</h4>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#ef4444" }}></div>
                        <span className="text-xs">{t('priorities.high')} (≥12)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f59e0b" }}></div>
                        <span className="text-xs">{t('priorities.medium')} (6-11)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#22c55e" }}></div>
                        <span className="text-xs">{t('priorities.low')} (&lt;6)</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 border-t pt-2">
                    {t('priorities.scoreCalculation')}
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
                                        {t('priorities.priority')}: {getPriorityLevelText(priorityLevel)} ({t('priorities.score')}: {priorityScore})
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {t('priorities.calculation')}: (6 - {obj.technical_condition}) × 3 + {new Date().getFullYear() - new Date(obj.passport_date).getFullYear()} {t('priorities.years')} = {priorityScore}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>{t('priorities.region')}:</strong> {obj.region}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>{t('priorities.coordinates')}:</strong> {obj.latitude.toFixed(4)} N, {obj.longitude.toFixed(4)} E
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>{t('priorities.type')}:</strong> {obj.resource_type}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>{t('priorities.technicalCondition')}:</strong> {obj.technical_condition}/5
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <strong>{t('priorities.passportDate')}:</strong> {obj.passport_date} ({new Date().getFullYear() - new Date(obj.passport_date).getFullYear()} {t('priorities.years')})
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
                            {selectedWater ? t('admin.informationAboutWaterObject') : t('admin.createWaterObject')}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedWater ? t('admin.viewWaterObjectData') : t('admin.fillInformationAboutNewWaterObject')}
                        </SheetDescription>
                    </SheetHeader>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.name')}</Label>
                                    <Input {...register("name")} disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.region')}</Label>
                                    <Input {...register("region")} disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.latitude')}</Label>
                                    <Input {...register("latitude", { valueAsNumber: true })} type="number" step="any" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.longitude')}</Label>
                                    <Input {...register("longitude", { valueAsNumber: true })} type="number" step="any" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.waterType')}</Label>
                                    <FormField
                                        control={control}
                                        name="water_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedWater}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('admin.selectWaterType')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="fresh">{t('admin.fresh')}</SelectItem>
                                                            <SelectItem value="salty">{t('admin.salty')}</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.resourceType')}</Label>
                                    <FormField
                                        control={control}
                                        name="resource_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedWater}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('admin.selectResourceType')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="lake">{t('admin.lake')}</SelectItem>
                                                            <SelectItem value="reservoir">{t('admin.reservoir')}</SelectItem>
                                                            <SelectItem value="channel">{t('admin.channel')}</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.priority')}</Label>
                                    <Input {...register("priority", { valueAsNumber: true })} type="number" step="1" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.passportDate')}</Label>
                                    <Input {...register("passport_date")} type="date" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.technicalCondition')}</Label>
                                    <Input {...register("technical_condition", { valueAsNumber: true })} type="number" step="1" disabled={!!selectedWater} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.fauna')}</Label>
                                    <FormField
                                        control={control}
                                        name="fauna"
                                        render={({ field }) => (
                                            <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value.toString()} disabled={!!selectedWater}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('admin.selectFauna')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">{t('admin.yes')}</SelectItem>
                                            <SelectItem value="false">{t('admin.no')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>{t('admin.pdfLink')}</Label>
                                    <Input {...register("pdf_url")} type="text" disabled={!!selectedWater} />
                                </div>
                                {!selectedWater && (
                                    <Button type="submit">{t('admin.create')}</Button>
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
                        <SheetTitle>{t('admin.search')}</SheetTitle>
                        <SheetDescription>{t('admin.enterWaterObjectName')}</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Input
                            placeholder={t('admin.name')}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSearch} className="flex-1">{t('admin.search')}</Button>
                            <Button variant="outline" onClick={() => { setSearch(""); setSearchInput(""); setPage(0); }} className="flex-1">
                                {t('admin.reset')}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Sheet для фильтров */}
            <Sheet open={openFilterSheet} onOpenChange={setOpenFilterSheet}>
                <SheetContent className="z-[9999] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{t('admin.filters')}</SheetTitle>
                        <SheetDescription>
                            {t('admin.adjustFilterParameters')} {activeFiltersCount > 0 && `(${t('admin.active')}: ${activeFiltersCount})`}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>{t('admin.region')}</Label>
                            <Select value={region || "all"} onValueChange={(val) => setRegion(val === "all" ? "" : val)} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.allRegions')} />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">{t('admin.allRegions')}</SelectItem>
                                    <SelectItem value="Акмолинская область">{t('admin.akmola')}</SelectItem>
                                    <SelectItem value="Алматинская область">{t('admin.almaty')}</SelectItem>
                                    <SelectItem value="Атырауская область">{t('admin.atyrau')}</SelectItem>
                                    <SelectItem value="Восточно-Казахстанская область">{t('admin.eastKazakhstan')}</SelectItem>
                                    <SelectItem value="Жамбылская область">{t('admin.zhambyl')}</SelectItem>
                                    <SelectItem value="Западно-Казахстанская область">{t('admin.westKazakhstan')}</SelectItem>
                                    <SelectItem value="Карагандинская область">{t('admin.karaganda')}</SelectItem>
                                    <SelectItem value="Костанайская область">{t('admin.kostanay')}</SelectItem>
                                    <SelectItem value="Кызылординская область">{t('admin.kyzylorda')}</SelectItem>
                                    <SelectItem value="Павлодарская область">{t('admin.pavlodar')}</SelectItem>
                                    <SelectItem value="Туркестанская область">{t('admin.turkestan')}</SelectItem>
                                    <SelectItem value="Актюбинская область">{t('admin.aktobe')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Тип ресурса</Label>
                            <Select value={resource_type || "all"} onValueChange={(val) => setResourceType(val === "all" ? "" : val)} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.allTypes')} />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">{t('admin.allTypes')}</SelectItem>
                                    <SelectItem value="lake">{t('admin.lake')}</SelectItem>
                                    <SelectItem value="reservoir">{t('admin.reservoir')}</SelectItem>
                                    <SelectItem value="channel">{t('admin.channel')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>{t('admin.waterType')}</Label>
                            <Select value={water_type || "all"} onValueChange={(val) => setWaterType(val === "all" ? "" : val)} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.allWaterTypes')} />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">{t('admin.allWaterTypes')}</SelectItem>
                                    <SelectItem value="fresh">{t('admin.fresh')}</SelectItem>
                                    <SelectItem value="salty">{t('admin.salty')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>{t('admin.fauna')}</Label>
                            <Select value={fauna === undefined ? "all" : fauna.toString()} onValueChange={(val) => setFauna(val === "all" ? undefined : val === "true")} defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.notImportant')} />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="all">{t('admin.notImportant')}</SelectItem>
                                    <SelectItem value="true">{t('admin.yes')}</SelectItem>
                                    <SelectItem value="false">{t('admin.no')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleApplyFilters} className="flex-1">{t('admin.apply')}</Button>
                            <Button variant="outline" onClick={handleResetFilters} className="flex-1">{t('admin.reset')}</Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Sheet для сортировки */}
            <Sheet open={openSortSheet} onOpenChange={setOpenSortSheet}>
                <SheetContent className="z-[9999]">
                    <SheetHeader>
                        <SheetTitle>{t('admin.sorting')}</SheetTitle>
                        <SheetDescription>{t('admin.selectFieldAndSortOrder')}</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>{t('admin.sortField')}</Label>
                            <Select value={sortField} onValueChange={setSortField} defaultValue="priority">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                        <SelectItem value="priority">{t('admin.priority')}</SelectItem>
                                    <SelectItem value="name">{t('admin.name')}</SelectItem>
                                    <SelectItem value="region">{t('admin.region')}</SelectItem>
                                    <SelectItem value="technical_condition">{t('admin.technicalCondition')}</SelectItem>
                                    <SelectItem value="passport_date">{t('admin.passportDate')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>{t('admin.sortOrder')}</Label>
                            <Select value={sortOrder} onValueChange={(val: "ASC" | "DESC") => setSortOrder(val)} defaultValue="DESC">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[99999]">
                                    <SelectItem value="ASC">{t('admin.ascending')}</SelectItem>
                                    <SelectItem value="DESC">{t('admin.descending')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleApplySort}>{t('admin.apply')}</Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}