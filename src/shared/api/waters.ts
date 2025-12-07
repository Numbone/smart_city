import { apiService } from "./api"

// Типы
export interface IWater {
  id: number
  name: string
  region: string
  resource_type: string
  water_type: string
  fauna: boolean
  passport_date: string
  technical_condition: number
  latitude: number
  longitude: number
  pdf_url?: string
  priority?: number
}

export interface FindAllWatersDto {
  page?: number
  limit?: number
  search?: string
  sortField?: string
  sortOrder?: "ASC" | "DESC"
  region?: string
  resource_type?: string
  water_type?: string
  fauna?: boolean
  passport_date_from?: string
  passport_date_to?: string
  technical_condition_from?: number
  technical_condition_to?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  hasNextPage: boolean
}

// ==================== API ====================

// GET /api/v1/waters
export const getAllWaters = async (
    params: FindAllWatersDto
  ): Promise<PaginatedResponse<IWater>> => {
    // Фильтруем параметры: оставляем только непустые значения
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([key, value]) => {
        // Для page и limit всегда отправляем (даже если 0)
        if (key === 'page' || key === 'limit') return true;

        if (key === "fauna") return value === true || value === false;
        
        // Для boolean - отправляем только если true
        if (typeof value === 'boolean') return value === true;
        
        // Для чисел - отправляем только если больше 0
        if (typeof value === 'number') return value > 0;
        
        // Для строк - отправляем только если не пустые
        if (typeof value === 'string') return value.trim() !== '';
        
        // Остальное фильтруем
        return value !== null && value !== undefined;
      })
    );
  
    const response = await apiService.get("/waters", filteredParams)
    return response.data
  }

// GET /api/v1/waters/:id
export const getWaterById = async (id: number): Promise<IWater> => {
  const response = await apiService.get(`/waters/${id}`)
  return response.data
}

// POST /api/v1/waters
export const createWater = async (data: Partial<IWater>): Promise<IWater> => {
  const response = await apiService.post("/waters", data)
  return response.data
}

// PATCH /api/v1/waters/:id
export const updateWater = async (
  id: number,
  data: Partial<IWater>
): Promise<IWater> => {
  const response = await apiService.patch(`/waters/${id}`, data)
  return response.data
}

// DELETE /api/v1/waters/:id
export const deleteWater = async (id: number): Promise<{ message: string }> => {
  const response = await apiService.delete(`/waters/${id}`)
  return response.data
}

// Экспорт единым объектом
export const waterService = {
  getAllWaters,
  getWaterById,
  createWater,
  updateWater,
  deleteWater,
}
