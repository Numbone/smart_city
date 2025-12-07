import { Header } from '@/components/Header'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { getAllWaters, IWater } from '@/shared/api/waters'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Download, Eye, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type SortField = 'name' | 'region' | 'priority' | 'technicalCondition' | 'passportDate'
type SortOrder = 'asc' | 'desc'
type PriorityLevel = 'high' | 'medium' | 'low'

// Расчет приоритета: PriorityScore = (6 - состояние) * 3 + возраст паспорта в годах
const calculatePriority = (obj: IWater): number => {
  const today = new Date()
  const passportDate = new Date(obj.passport_date)
  const ageInYears = Math.floor((today.getTime() - passportDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
  return (6 - obj.technical_condition) * 3 + ageInYears
}

const getPriorityLevel = (score: number): PriorityLevel => {
  if (score >= 12) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

const getPriorityBadge = (level: PriorityLevel) => {
  const styles = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  }
  const labels = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий'
  }
  return <Badge className={styles[level]}>{labels[level]}</Badge>
}

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

const PrioritiesPage = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all')
  const [waterTypeFilter, setWaterTypeFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState<string>('all')
  const [selectedWater, setSelectedWater] = useState<IWater | null>(null)
  const [openDetailSheet, setOpenDetailSheet] = useState(false)

  // Получаем данные из API
  const { data: waters, isLoading } = useQuery({
    queryKey: ['waters', 0, 1000], // Получаем все данные для клиентской фильтрации
    queryFn: () => getAllWaters({
      page: 0,
      limit: 1000,
      search: '',
      sortField: 'priority',
      sortOrder: 'DESC',
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

  // Расчет приоритетов и фильтрация
  const processedData = useMemo(() => {
    if (!waters?.data) return []

    let filtered = waters.data.map(obj => ({
      ...obj,
      priorityScore: calculatePriority(obj),
      priorityLevel: getPriorityLevel(calculatePriority(obj))
    }))

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

    // Фильтр по приоритету
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(obj => obj.priorityLevel === priorityFilter)
    }

    // Фильтр по типу ресурса
    if (resourceTypeFilter !== 'all') {
      filtered = filtered.filter(obj => obj.resource_type === resourceTypeFilter)
    }

    // Фильтр по типу воды
    if (waterTypeFilter !== 'all') {
      filtered = filtered.filter(obj => obj.water_type === waterTypeFilter)
    }

    // Фильтр по техническому состоянию
    if (conditionFilter !== 'all') {
      filtered = filtered.filter(obj => obj.technical_condition === Number(conditionFilter))
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'priority':
          comparison = a.priorityScore - b.priorityScore
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'region':
          comparison = a.region.localeCompare(b.region)
          break
        case 'technicalCondition':
          comparison = a.technical_condition - b.technical_condition
          break
        case 'passportDate':
          comparison = new Date(a.passport_date).getTime() - new Date(b.passport_date).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [waters, searchQuery, sortField, sortOrder, regionFilter, priorityFilter, resourceTypeFilter, waterTypeFilter, conditionFilter])

  // Статистика
  const stats = useMemo(() => {
    const high = processedData.filter(obj => obj.priorityLevel === 'high').length
    const medium = processedData.filter(obj => obj.priorityLevel === 'medium').length
    const low = processedData.filter(obj => obj.priorityLevel === 'low').length
    return { high, medium, low, total: processedData.length }
  }, [processedData])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const regions = useMemo(() => 
    Array.from(new Set(waters?.data?.map(obj => obj.region) || [])).sort(),
    [waters]
  )

  const handleViewDetails = (obj: IWater) => {
    setSelectedWater(obj)
    setOpenDetailSheet(true)
  }

  const activeFiltersCount = [
    regionFilter !== 'all',
    priorityFilter !== 'all',
    resourceTypeFilter !== 'all',
    waterTypeFilter !== 'all',
    conditionFilter !== 'all',
    searchQuery
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Заголовок */}
        <div className="mb-6 flex items-center gap-2">
                <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Приоритизация объектов</h1>
          <p className="text-gray-600 mt-2">
            Анализ и определение приоритетности обследования водных объектов
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Всего объектов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Высокий приоритет</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.high}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Средний приоритет</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Низкий приоритет</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.low}</div>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры и поиск */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Поиск */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по названию или региону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Фильтр по приоритету */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все приоритеты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приоритеты</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="low">Низкий</SelectItem>
                </SelectContent>
              </Select>

              {/* Кнопка экспорта */}
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Экспорт
              </Button>
            </div>

            {/* Дополнительные фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Фильтр по области */}
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

              {/* Фильтр по типу ресурса */}
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все типы ресурсов" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="lake">Озеро</SelectItem>
                  <SelectItem value="reservoir">Водохранилище</SelectItem>
                  <SelectItem value="channel">Река/Канал</SelectItem>
                </SelectContent>
              </Select>

              {/* Фильтр по типу воды */}
              <Select value={waterTypeFilter} onValueChange={setWaterTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все типы воды" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="fresh">Пресная</SelectItem>
                  <SelectItem value="salty">Соленая</SelectItem>
                </SelectContent>
              </Select>

              {/* Фильтр по состоянию */}
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все состояния" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все состояния</SelectItem>
                  <SelectItem value="1">Категория 1</SelectItem>
                  <SelectItem value="2">Категория 2</SelectItem>
                  <SelectItem value="3">Категория 3</SelectItem>
                  <SelectItem value="4">Категория 4</SelectItem>
                  <SelectItem value="5">Категория 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Активных фильтров: {activeFiltersCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setRegionFilter('all')
                    setPriorityFilter('all')
                    setResourceTypeFilter('all')
                    setWaterTypeFilter('all')
                    setConditionFilter('all')
                  }}
                >
                  Сбросить все
                </Button>
              </div>
            )}
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
                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                      <div className="flex items-center">
                        Название
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('region')}>
                      <div className="flex items-center">
                        Область
                        {getSortIcon('region')}
                      </div>
                    </TableHead>
                    <TableHead>Тип ресурса</TableHead>
                    <TableHead>Тип воды</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('technicalCondition')}>
                      <div className="flex items-center">
                        Состояние
                        {getSortIcon('technicalCondition')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('passportDate')}>
                      <div className="flex items-center">
                        Дата паспорта
                        {getSortIcon('passportDate')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                      <div className="flex items-center">
                        Приоритет
                        {getSortIcon('priority')}
                      </div>
                    </TableHead>
                    <TableHead>Балл</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((obj) => (
                    <TableRow key={obj.id}>
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
                      <TableCell>{new Date(obj.passport_date).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>{getPriorityBadge(obj.priorityLevel)}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{obj.priorityScore}</span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(obj)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Подробнее
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && processedData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Объекты не найдены
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sheet с деталями объекта */}
      <Sheet open={openDetailSheet} onOpenChange={setOpenDetailSheet}>
        <SheetContent className="z-[9999] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedWater?.name}</SheetTitle>
            <SheetDescription>Подробная информация о водном объекте</SheetDescription>
          </SheetHeader>
          {selectedWater && (
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Регион</Label>
                <p className="font-medium">{selectedWater.region}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-600">Тип ресурса</Label>
                <p className="font-medium">{getResourceTypeLabel(selectedWater.resource_type)}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-600">Тип воды</Label>
                <p className="font-medium">{getWaterTypeLabel(selectedWater.water_type)}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-600">Фауна</Label>
                <p className="font-medium">{selectedWater.fauna ? 'Есть' : 'Нет'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-600">Техническое состояние</Label>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getConditionColor(selectedWater.technical_condition)}`} />
                  <span className="font-medium">Категория {selectedWater.technical_condition}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-600">Дата паспорта</Label>
                <p className="font-medium">
                  {new Date(selectedWater.passport_date).toLocaleDateString('ru-RU')}
                  <span className="text-sm text-gray-500 ml-2">
                    ({new Date().getFullYear() - new Date(selectedWater.passport_date).getFullYear()} лет назад)
                  </span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-600">Координаты</Label>
                <p className="font-medium">
                  {selectedWater.latitude.toFixed(6)}, {selectedWater.longitude.toFixed(6)}
                </p>
              </div>
              
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <Label className="text-gray-600">Приоритет обследования</Label>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(getPriorityLevel(calculatePriority(selectedWater)))}
                  <span className="font-semibold">Балл: {calculatePriority(selectedWater)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Расчёт: (6 - {selectedWater.technical_condition}) × 3 + {new Date().getFullYear() - new Date(selectedWater.passport_date).getFullYear()} = {calculatePriority(selectedWater)}
                </p>
              </div>
              
              {selectedWater.pdf_url && (
                <Button className="w-full" variant="outline">
                  Открыть паспорт объекта
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default PrioritiesPage