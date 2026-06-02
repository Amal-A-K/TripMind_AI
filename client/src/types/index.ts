// ─── Auth ────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ─── Itinerary ───────────────────────────────────────────────
export interface DayActivity {
  time: string;
  title: string;
  description: string;
  location?: string;
  duration?: string;
  cost?: string;
  category: 'accommodation' | 'food' | 'activity' | 'transport' | 'other';
}

export interface ItineraryDay {
  day: number;
  date?: string;
  theme: string;
  activities: DayActivity[];
}

export interface Itinerary {
  _id: string;
  title: string;
  destination: string;
  duration: number;
  startDate?: string;
  endDate?: string;
  budget?: string;
  travelStyle?: string;
  coverImage?: string;
  days: ItineraryDay[];
  summary: string;
  tips?: string[];
  totalEstimatedCost?: string;
  isPublic: boolean;
  shareToken?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateItineraryPayload {
  destination: string;
  duration: number;
  budget?: string;
  travelStyle?: string;
  interests?: string[];
  startDate?: string;
  additionalNotes?: string;
}

// ─── API ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// ─── Upload ──────────────────────────────────────────────────
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url?: string;
  extractedText?: string;
}

// ─── UI ──────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
