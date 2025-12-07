import { Header } from '@/components/Header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAllWaters, IWater, waterService } from '@/shared/api/waters'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, FileText, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const getConditionColor = (condition: number) => {
  const colors = {
    1: 'bg-green-500',
    2: 'bg-lime-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500'
  }
  return colors[condition as keyof typeof colors] || 'bg-gray-500'
}

const getResourceTypeLabel = (type: string) => {
  const labels = {
    lake: 'Озеро',
    channel: 'Река/Канал',
    reservoir: 'Водохранилище'
  }
  return labels[type as keyof typeof labels] || type
}

const getWaterTypeLabel = (type: string) => {
  const labels = {
    fresh: 'Пресная',
    salty: 'Соленая'
  }
  return labels[type as keyof typeof labels] || type
}

export const AdminPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [openSheet, setOpenSheet] = useState(false)
  const [selectedWater, setSelectedWater] = useState<IWater | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [waterToDelete, setWaterToDelete] = useState<IWater | null>(null)

  // Получаем данные
  const { data: waters, isLoading } = useQuery({
    queryKey: ['waters', 0, 1000],
    queryFn: () => getAllWaters({
      page: 0,
      limit: 1000,
      search: '',
      sortField: 'name',
      sortOrder: 'ASC',
      region: '',
      resource_type: '',
      water_type: '',
      fauna: undefined,
      passport_date_from: '',
      passport_date_to: '',
      technical_condition_from: undefined,
      technical_condition_to: undefined,
    }),
  })

  // Форма
  const defaultValues: IWater = {
    id: 0,
    name: '',
    latitude: 0,
    longitude: 0,
    water_type: '',
    resource_type: '',
    fauna: false,
    passport_date: '',
    technical_condition: 1,
    priority: 0,
    region: '',
    pdf_url: '',
  }

  const form = useForm<IWater>({
    defaultValues,
  })

  const { handleSubmit, control, register, reset } = form

  // Мутации
  const createMutation = useMutation({
    mutationFn: (data: IWater) => waterService.createWater(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waters'] })
      toast.success('Объект успешно создан!')
      handleCloseSheet()
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Ошибка при создании объекта')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IWater }) => 
      waterService.updateWater(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waters'] })
      toast.success('Объект успешно обновлен!')
      handleCloseSheet()
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Ошибка при обновлении объекта')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => waterService.deleteWater(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waters'] })
      toast.success('Объект успешно удален!')
      setDeleteDialogOpen(false)
      setWaterToDelete(null)
    },
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Ошибка при удалении объекта')
    }
  })

  // Обработчики
  const handleOpenSheet = (water?: IWater) => {
    if (water) {
      setSelectedWater(water)
      reset(water)
    } else {
      setSelectedWater(null)
      reset(defaultValues)
    }
    setOpenSheet(true)
  }

  const handleCloseSheet = () => {
    setOpenSheet(false)
    setSelectedWater(null)
    reset(defaultValues)
  }

  const onSubmit = async (data: IWater) => {
    if (selectedWater?.id) {
      updateMutation.mutate({ id: selectedWater.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDeleteClick = (water: IWater) => {
    setWaterToDelete(water)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (waterToDelete?.id) {
      deleteMutation.mutate(waterToDelete.id)
    }
  }

  // Фильтрация
  const filteredData = useMemo(() => {
    if (!waters?.data) return []

    let filtered = [...waters.data]

    // Поиск
    if (searchQuery) {
      filtered = filtered.filter(obj =>
        obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Фильтр по области
    if (regionFilter !== 'all') {
      filtered = filtered.filter(obj => obj.region === regionFilter)
    }

    return filtered
  }, [waters, searchQuery, regionFilter])

  const regions = useMemo(() => 
    Array.from(new Set(waters?.data?.map(obj => obj.region) || [])).sort(),
    [waters]
  )

  // Статистика
  const stats = useMemo(() => {
    if (!waters?.data) return { total: 0, byCondition: {} }
    
    const byCondition: Record<number, number> = {}
    waters.data.forEach(obj => {
      byCondition[obj.technical_condition] = (byCondition[obj.technical_condition] || 0) + 1
    })

    return {
      total: waters.data.length,
      byCondition
    }
  }, [waters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Заголовок */}
        <div className="mb-6 flex justify-between items-center">
        <div className="mb-6 flex items-center gap-2">
                <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                </Button>
        </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Панель администратора</h1>
            <p className="text-gray-600 mt-2">
              Управление водными объектами и гидротехническими сооружениями
            </p>
          </div>
          <Button onClick={() => handleOpenSheet()} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Добавить объект
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Всего объектов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          {[1, 2, 3, 4, 5].map(condition => (
            <Card key={condition}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Категория {condition}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getConditionColor(condition)}`} />
                  <span className="text-2xl font-bold">{stats.byCondition[condition] || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по названию или региону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все области" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все области</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Таблица */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Загрузка данных...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Область</TableHead>
                    <TableHead>Тип ресурса</TableHead>
                    <TableHead>Тип воды</TableHead>
                    <TableHead>Состояние</TableHead>
                    <TableHead>Фауна</TableHead>
                    <TableHead>Дата паспорта</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((obj) => (
                    <TableRow key={obj.id}>
                      <TableCell className="font-medium">#{obj.id}</TableCell>
                      <TableCell className="font-medium">{obj.name}</TableCell>
                      <TableCell>{obj.region}</TableCell>
                      <TableCell>{getResourceTypeLabel(obj.resource_type)}</TableCell>
                      <TableCell>{getWaterTypeLabel(obj.water_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getConditionColor(obj.technical_condition)}`} />
                          <span>{obj.technical_condition}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={obj.fauna ? "default" : "outline"}>
                          {obj.fauna ? 'Есть' : 'Нет'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(obj.passport_date).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSheet(obj)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(obj)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Объекты не найдены
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sheet для создания/редактирования */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="z-[9999] overflow-y-auto sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {selectedWater ? 'Редактирование объекта' : 'Создание нового объекта'}
            </SheetTitle>
            <SheetDescription>
              {selectedWater 
                ? 'Измените данные водного объекта' 
                : 'Заполните информацию о новом водном объекте'}
            </SheetDescription>
          </SheetHeader>
          
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>Наименование *</Label>
                  <Input {...register("name")} placeholder="Название объекта" required />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Регион *</Label>
                  <FormField
                    control={control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите регион" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[99999]">
                            <SelectGroup>
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
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Широта *</Label>
                    <Input 
                      {...register("latitude", { valueAsNumber: true })} 
                      type="number" 
                      step="any" 
                      placeholder="43.2220"
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Долгота *</Label>
                    <Input 
                      {...register("longitude", { valueAsNumber: true })} 
                      type="number" 
                      step="any" 
                      placeholder="76.8512"
                      required 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Тип ресурса *</Label>
                  <FormField
                    control={control}
                    name="resource_type"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип ресурса" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[99999]">
                            <SelectGroup>
                              <SelectItem value="lake">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Озеро
                                </div>
                              </SelectItem>
                              <SelectItem value="reservoir">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Водохранилище
                                </div>
                              </SelectItem>
                              <SelectItem value="channel">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Река/Канал
                                </div>
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Тип воды *</Label>
                  <FormField
                    control={control}
                    name="water_type"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип воды" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[99999]">
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
                  <Label>Наличие фауны</Label>
                  <FormField
                    control={control}
                    name="fauna"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={(val) => field.onChange(val === "true")} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите наличие фауны" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[99999]">
                            <SelectItem value="true">Есть</SelectItem>
                            <SelectItem value="false">Нет</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Техническое состояние *</Label>
                  <FormField
                    control={control}
                    name="technical_condition"
                    render={({ field }) => (
                      <FormItem>
                        <Select 
                          onValueChange={(val) => field.onChange(Number(val))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[99999]">
                            {[1, 2, 3, 4, 5].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${getConditionColor(num)}`} />
                                  Категория {num}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Дата паспорта *</Label>
                  <Input {...register("passport_date")} type="date" required />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Ссылка на PDF паспорт</Label>
                  <div className="flex gap-2">
                    <Input 
                      {...register("pdf_url")} 
                      type="text" 
                      placeholder="https://example.com/passport.pdf"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      'Сохранение...'
                    ) : selectedWater ? (
                      'Сохранить изменения'
                    ) : (
                      'Создать объект'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseSheet}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Объект "{waterToDelete?.name}" будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminPage