import { api } from '../lib/api'
import { User, ApiResponse, AuthResponse, SignUpRequest, LoginRequest } from '../types/api'

// Generic API request function
export const apiRequest = async (url: string, options: RequestInit = {}): Promise<any> => {
  const method = (options.method || 'GET').toLowerCase()
  const data = options.body ? JSON.parse(options.body as string) : undefined

  let response
  switch (method) {
    case 'post':
      response = await api.post(url, data)
      break
    case 'put':
      response = await api.put(url, data)
      break
    case 'patch':
      response = await api.patch(url, data)
      break
    case 'delete':
      response = await api.delete(url)
      break
    default:
      response = await api.get(url)
  }

  return response.data
}

export const authApi = {
  signup: async (data: SignUpRequest): Promise<ApiResponse<User>> => {
    const response = await api.post('/api/v1/auth/signup', data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/api/v1/auth/login', data)
    return response.data
  },

  logout: async (): Promise<ApiResponse<string>> => {
    const response = await api.post('/api/v1/auth/logout')
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/v1/auth/me')
    return response.data
  },

  rotateSession: async (): Promise<ApiResponse<string>> => {
    const response = await api.post('/api/v1/auth/rotate-session')
    return response.data
  },
}

export const coursesApi = {
  getActiveCourses: async () => {
    const response = await api.get('/api/v1/courses')
    return response.data
  },

  getAllCourses: async (page = 0, size = 10) => {
    const response = await api.get(`/api/v1/courses/all?page=${page}&size=${size}`)
    return response.data
  },

  getCourseById: async (id: number) => {
    const response = await api.get(`/api/v1/courses/${id}`)
    return response.data
  },

  searchCourses: async (name: string) => {
    const response = await api.get(`/api/v1/courses/search?name=${name}`)
    return response.data
  },

  createCourse: async (data: any) => {
    const response = await api.post('/api/v1/courses', data)
    return response.data
  },

  updateCourse: async (id: number, data: any) => {
    const response = await api.put(`/api/v1/courses/${id}`, data)
    return response.data
  },

  archiveCourse: async (id: number) => {
    const response = await api.put(`/api/v1/courses/${id}/archive`)
    return response.data
  },
}

export const usersApi = {
  getUsers: async (lastId?: number, limit = 20, search?: string, role?: string, status?: string) => {
    let url = `/api/v1/users?limit=${limit}`
    if (lastId) url += `&lastId=${lastId}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (role) url += `&role=${role}`
    if (status) url += `&status=${status}`
    const response = await api.get(url)
    return response.data
  },

  approveUser: async (id: number) => {
    const response = await api.post(`/api/v1/users/${id}/approve`)
    return response.data
  },

  changeUserRole: async (id: number, role: string) => {
    const response = await api.post(`/api/v1/users/${id}/roles`, { role })
    return response.data
  },
}

export const enrollmentsApi = {
  getEnrollments: async (lastId?: number, limit = 20, type?: string, status?: string, courseId?: number, studentId?: number) => {
    let url = `/api/v1/enrollments?limit=${limit}`
    if (lastId) url += `&lastId=${lastId}`
    if (type) url += `&type=${type}`
    if (status) url += `&status=${status}`
    if (courseId) url += `&courseId=${courseId}`
    if (studentId) url += `&studentId=${studentId}`
    const response = await api.get(url)
    return response.data
  },

  updateEnrollmentStatus: async (id: number, status: string) => {
    const response = await api.put(`/api/v1/enrollments/${id}/status`, { status })
    return response.data
  },

  enrollInCourse: async (courseId: number) => {
    const response = await api.post('/api/v1/enrollments', { courseId })
    return response.data
  },
}

export const gradesApi = {
  getGrades: async (lastId?: number, limit = 20, courseId?: number, studentId?: number) => {
    let url = `/api/v1/grades?limit=${limit}`
    if (lastId) url += `&lastId=${lastId}`
    if (courseId) url += `&courseId=${courseId}`
    if (studentId) url += `&studentId=${studentId}`
    const response = await api.get(url)
    return response.data
  },

  updateGrade: async (id: number, score: number, feedback?: string) => {
    const response = await api.put(`/api/v1/grades/${id}`, { score, feedback })
    return response.data
  },

  createGrade: async (data: { enrollmentId: number; score: number; feedback?: string }) => {
    const response = await api.post('/api/v1/grades', data)
    return response.data
  },
}

export const configApi = {
  getMeta: async () => {
    const response = await api.get('/api/v1/config/meta')
    return response.data
  },
}

export const actuatorApi = {
  getHealth: async () => {
    const response = await api.get('/actuator/health')
    return response.data
  },

  getInfo: async () => {
    const response = await api.get('/actuator/info')
    return response.data
  },
}

export const exportsApi = {
  exportUsers: async () => {
    const response = await api.get('/api/v1/exports/users', { responseType: 'blob' })
    return response.data
  },

  exportCourses: async () => {
    const response = await api.get('/api/v1/exports/courses', { responseType: 'blob' })
    return response.data
  },

  exportEnrollments: async () => {
    const response = await api.get('/api/v1/exports/enrollments', { responseType: 'blob' })
    return response.data
  },

  exportGrades: async () => {
    const response = await api.get('/api/v1/exports/grades', { responseType: 'blob' })
    return response.data
  },
}
