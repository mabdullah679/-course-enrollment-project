// API Types
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STAFF = 'STAFF'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED'
}

export enum EnrollmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED', 
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED'
}

export enum EnrollmentType {
  CREDIT = 'CREDIT',
  AUDIT = 'AUDIT'
}

export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  approved: boolean
  active: boolean
  createdAt: string
}

export interface Course {
  id: number
  code: string
  name: string
  description?: string
  credits: number
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED'
  createdAt: string
}

export interface Enrollment {
  id: number
  student: User
  course: Course
  status: EnrollmentStatus
  type: EnrollmentType
  enrolledAt: string
}

export interface Grade {
  id: number
  enrollment: Enrollment
  student: User
  score: number
  feedback?: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  errorCode?: string
}

export interface AuthResponse {
  user: User
}

// Request Types
export interface SignUpRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  accountType: UserRole
  username?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface PaginatedResponse<T> {
  content: T[]
  hasNext: boolean
  nextCursor?: number
}

export interface CourseCreateRequest {
  name: string
  courseCode: string
  credits: number
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED'
  description?: string
}

export interface GradeCreateRequest {
  enrollmentId: number
  score: number
  feedback?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  hasNext: boolean
  nextCursor?: number
}
