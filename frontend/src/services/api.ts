import { api } from '../lib/api'
import { User, ApiResponse, AuthResponse, SignUpRequest, LoginRequest } from '../types/api'

/**
 * Generic fetch-like helper on top of axios instance `api`.
 * Keeps compatibility with places using RequestInit.
 */
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

/* ----------------------------- AUTH ----------------------------- */

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
    const response = await api.post('/api/v1/auth/rotate')
    return response.data
  },

  // Correct path (backend expects /api/v1/auth/me)
  updateProfile: async (data: { firstName?: string; lastName?: string; email?: string }): Promise<ApiResponse<User>> => {
    const response = await api.patch('/api/v1/auth/me', data)
    return response.data
  },

  // Correct path (backend expects /api/v1/auth/me/password)
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<string>> => {
    const response = await api.post('/api/v1/auth/me/password', data)
    return response.data
  },
}

/* ---------------------------- COURSES --------------------------- */

export const coursesApi = {
  getCourses: async (after?: number, size = 20, ownerId?: number, term?: string, status?: string) => {
    let url = `/api/v1/courses?size=${size}`
    if (after) url += `&after=${after}`
    if (ownerId) url += `&ownerId=${ownerId}`
    if (term) url += `&term=${encodeURIComponent(term)}`
    if (status) url += `&status=${encodeURIComponent(status)}`
    const response = await api.get(url)
    return response.data
  },

  getStudentCourses: async (enrolled = true) => {
    const url = enrolled ? '/api/v1/courses?enrolled=true' : '/api/v1/courses'
    const response = await api.get(url)
    return response.data
  },

  getCourseById: async (id: number) => {
    const response = await api.get(`/api/v1/courses/${id}`)
    return response.data
  },

  searchCourses: async (name: string) => {
    const response = await api.get(`/api/v1/courses/search?name=${encodeURIComponent(name)}`)
    return response.data
  },

  createCourse: async (data: { name: string; courseCode: string; credits: number; status: string; description?: string }) => {
    // Map frontend courseCode -> backend "code"
    const backendData = {
      name: data.name,
      code: data.courseCode,
      credits: data.credits,
      description: data.description,
    }
    const response = await api.post('/api/v1/courses', backendData)
    return response.data
  },

  updateCourse: async (id: number, data: any) => {
    const response = await api.put(`/api/v1/courses/${id}`, data)
    return response.data
  },

  updateCourseStatus: async (id: number, status: string) => {
    const response = await api.put(`/api/v1/courses/${id}/status`, { status })
    return response.data
  },

  getCourseAuditHistory: async (id: number) => {
    const response = await api.get(`/api/v1/courses/${id}/audit`)
    return response.data
  },

  archiveCourse: async (id: number) => {
    const response = await api.put(`/api/v1/courses/${id}/archive`)
    return response.data
  },
}

/* ----------------------------- USERS ---------------------------- */

export const usersApi = {
  getUsers: async (
    after?: number,
    size = 20,
    q?: string,
    role?: string,
    status?: string,
    approved?: boolean,
    active?: boolean
  ) => {
    let url = `/api/v1/users?size=${size}`
    if (after) url += `&after=${after}`
    if (q) url += `&q=${encodeURIComponent(q)}`
    if (role) url += `&role=${encodeURIComponent(role)}`
    if (status) url += `&status=${encodeURIComponent(status)}`
    if (approved !== undefined) url += `&approved=${approved}`
    if (active !== undefined) url += `&active=${active}`
    const response = await api.get(url)
    return response.data
  },

  approveUser: async (id: number) => {
    const response = await api.post(`/api/v1/users/${id}/approve`)
    return response.data
  },

  changeUserRole: async (id: number, role: string) => {
    const response = await api.post(`/api/v1/users/${id}/role`, { role })
    return response.data
  },

  changeUserStatus: async (id: number, approved?: boolean, active?: boolean) => {
    const body: any = {}
    if (approved !== undefined) body.approved = approved
    if (active !== undefined) body.active = active
    const response = await api.put(`/api/v1/users/${id}/status`, body)
    return response.data
  },

  getUserAuditHistory: async (id: number, after?: string, limit = 25) => {
    let url = `/api/v1/users/${id}/audit?limit=${limit}`
    if (after) url += `&after=${encodeURIComponent(after)}`
    const response = await api.get(url)
    return response.data
  },

  getUserProfile: async (id: number) => {
    const response = await api.get(`/api/v1/users/${id}`)
    return response.data
  },
}

/* -------------------------- ENROLLMENTS ------------------------- */

export const enrollmentsApi = {
  // List (supports after/size/type/semester/courseId/studentId/status)
  getEnrollments: async (after?: number, size = 20, type?: string, semester?: string, courseId?: number, studentId?: number, status?: string) => {
    const params = new URLSearchParams({ size: String(size) })
    if (after) params.append('after', String(after))
    if (type) params.append('type', type)
    if (semester) params.append('semester', semester)
    if (courseId) params.append('courseId', String(courseId))
    if (studentId) params.append('studentId', String(studentId))
    if (status) params.append('status', status)
    const response = await api.get(`/api/v1/enrollments?${params.toString()}`)
    return response.data
  },

  getStudentEnrollments: async (studentId: number) => {
    const response = await api.get(`/api/v1/enrollments?studentId=${studentId}`)
    return response.data
  },

  // Friendly helper used by Courses page to enroll current student in a course
  enrollInCourse: async (courseId: number) => {
    const response = await api.post('/api/v1/enrollments', { courseId })
    return response.data
  },

  // Create — backend expects { studentId, courseId, status? } (no "type")
  createEnrollment: async (data: { studentId: number; courseId: number; status?: string }) => {
    const payload: any = { studentId: data.studentId, courseId: data.courseId }
    if (data.status) payload.status = data.status
    const response = await api.post('/api/v1/enrollments', payload)
    return response.data
  },

  // Update status
  updateEnrollmentStatus: async (id: number, status: string) => {
    const response = await api.put(`/api/v1/enrollments/${id}/status`, { status })
    return response.data
  },
}

/* ---------------------------- GRADES ---------------------------- */

export const gradesApi = {
  getGrades: async (after?: number, size = 20, courseId?: number, studentId?: number, status?: string) => {
    let url = `/api/v1/grades?size=${size}`
    if (after) url += `&after=${after}`
    if (courseId) url += `&courseId=${courseId}`
    if (studentId) url += `&studentId=${studentId}`
    if (status) url += `&status=${encodeURIComponent(status)}`
    const response = await api.get(url)
    return response.data
  },

  getStudentGrades: async (studentId: number) => {
    const response = await api.get(`/api/v1/grades?studentId=${studentId}`)
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

/* ----------------------------- CONFIG --------------------------- */

export const configApi = {
  getMeta: async () => {
    const response = await api.get('/api/v1/config/meta')
    return response.data
  },

  getEnrollmentWindow: async () => {
    const response = await api.get('/api/v1/enrollment-window')
    return response.data
  },

  // Backend enum is ON/OFF; optional term/startDate/endDate (ISO 8601 strings)
  updateEnrollmentWindow: async (data: { status: 'ON' | 'OFF'; term?: string; startDate?: string; endDate?: string }) => {
    const payload: any = { status: data.status }
    if (data.term) payload.term = data.term
    if (data.startDate) payload.startDate = data.startDate
    if (data.endDate) payload.endDate = data.endDate
    const response = await api.put('/api/v1/enrollment-window', payload)
    return response.data
  },
}

/* ----------------------------- HEALTH --------------------------- */

export const healthApi = {
  getHealth: async () => {
    const response = await api.get('/api/v1/health')
    return response.data
  },
}

/* ----------------------- ENROLLMENT WINDOW ---------------------- */

export const enrollmentWindowApi = {
  getEnrollmentWindow: async () => {
    const response = await api.get('/api/v1/enrollment-window')
    return response.data
  },

  updateEnrollmentWindow: async (data: { status: 'ON' | 'OFF'; term?: string; startDate?: string; endDate?: string }) => {
    const payload: any = { status: data.status }
    if (data.term) payload.term = data.term
    if (data.startDate) payload.startDate = data.startDate
    if (data.endDate) payload.endDate = data.endDate
    const response = await api.put('/api/v1/enrollment-window', payload)
    return response.data
  },
}

/* ---------------------------- METRICS --------------------------- */

export const metricsApi = {
  getUsersCount: async () => {
    const response = await api.get('/api/v1/metrics/users')
    return response.data
  },

  getCoursesCount: async () => {
    const response = await api.get('/api/v1/metrics/courses')
    return response.data
  },

  getEnrollmentsCount: async () => {
    const response = await api.get('/api/v1/metrics/enrollments')
    return response.data
  },

  getGradesCount: async () => {
    const response = await api.get('/api/v1/metrics/grades')
    return response.data
  },

  getDashboardMetrics: async () => {
    const response = await api.get('/api/v1/metrics/dashboard')
    return response.data
  },
}

/* --------------------------- ACTUATOR --------------------------- */

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

/* ----------------------------- EXPORTS -------------------------- */

export const exportsApi = {
  exportUsers: async (filters?: any) => {
    const response = await api.post(
      '/api/v1/exports/csv',
      { resource: 'users', filters: filters || {} },
      { responseType: 'blob' }
    )
    return response.data
  },

  exportCourses: async (filters?: any) => {
    const response = await api.post(
      '/api/v1/exports/csv',
      { resource: 'courses', filters: filters || {} },
      { responseType: 'blob' }
    )
    return response.data
  },

  exportEnrollments: async (filters?: any) => {
    const response = await api.post(
      '/api/v1/exports/csv',
      { resource: 'enrollments', filters: filters || {} },
      { responseType: 'blob' }
    )
    return response.data
  },

  exportGrades: async (filters?: any) => {
    const response = await api.post(
      '/api/v1/exports/csv',
      { resource: 'grades', filters: filters || {} },
      { responseType: 'blob' }
    )
    return response.data
  },
}

/* ------------------------ COURSE ASSIGNMENTS -------------------- */

export const courseAssignmentsApi = {
  requestCourseAssignment: async (data: { instructorId: number; courseIds: number[]; semesterId?: string }) => {
    const response = await api.post('/api/v1/course-assignments/requests', data)
    return response.data
  },

  getAssignmentRequests: async () => {
    const response = await api.get('/api/v1/course-assignments/requests')
    return response.data
  },
}
