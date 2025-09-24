// User-related types for the IAM client

export interface User {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  email: string;
  name?: string;
  emailVerification: boolean;
  // Add other user properties as they become available
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  expire: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}