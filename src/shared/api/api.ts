import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true
})



axiosInstance.interceptors.request.use(
  (config) => {
    // config.params = { ...(config.params || {})}

    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`

    return config
  },
  (error) => Promise.reject(error)
)

let refreshPromise: Promise<string> | null = null
type Subscriber = (token: string) => void
const subscribers: Subscriber[] = []

const subscribeTokenRefresh = (cb: Subscriber) => subscribers.push(cb)
const onTokenRefreshed = (token: string) => {
  subscribers.forEach((cb) => cb(token))
  subscribers.length = 0
}

async function requestNewAccessToken(): Promise<string> {
  const url = `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`
  const { data } = await axios.post(url, null, { withCredentials: true })

  const newToken = data?.accessToken as string
  if (!newToken) throw new Error('No accessToken in refresh response')

  localStorage.setItem('token', newToken)

  axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`

  return newToken
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config

    if (!error?.response || error.response.status !== 401) {
      throw error
    }

    const isRefreshCall =
      originalRequest?.url?.includes('/refresh') || originalRequest?.__isRefreshRequest

    if (isRefreshCall) {
      // window.location.replace('/auth')
      throw error
    }

    if (originalRequest._isRetry) {
      throw error
    }
    originalRequest._isRetry = true

    try {
      if (!refreshPromise) {
        refreshPromise = requestNewAccessToken().finally(() => {
          refreshPromise = null
        })
      }

      const newToken = await refreshPromise

      originalRequest.headers = {
        ...(originalRequest.headers || {}),
        Authorization: `Bearer ${newToken}`
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          axiosInstance(originalRequest).then(resolve).catch(reject)
        })
        onTokenRefreshed(newToken)
      })
    } catch (refreshErr) {
      localStorage.removeItem('jwtToken')
      window.location.replace('/')
      throw refreshErr
    }
  }
)

const post = async (url: string, data = {}, params = {}) =>
  axiosInstance({ method: 'POST', url, data, params })

const get = async (url: string, params = {}) => axiosInstance({ method: 'GET', url, params })

const getFile = async (url: string, data = {}, params = {}) =>
  axiosInstance({ method: 'POST', url, data, params, responseType: 'blob' })

const getFileBlob = async (url: string, params = {}) =>
  axiosInstance({ method: 'GET', url, params, responseType: 'blob' })

const put = async (url: string, data = {}) => axiosInstance({ method: 'PUT', url, data })

const patch = async (url: string, data = {}) => axiosInstance({ method: 'PATCH', url, data })

const _delete = async (url: string, data = {}) => axiosInstance({ method: 'DELETE', url, data })

export default axiosInstance

export const apiService = {
  post,
  get,
  put,
  getFile,
  delete: _delete,
  getFileBlob,
  patch
}