export const API_ERRORS = {
  // Auth errors
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'EMAIL_ALREADY_EXISTS',
    message: 'Email is already registered',
  },
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    message: 'Password is too weak',
  },

  // Entry errors
  ENTRY_NOT_FOUND: {
    code: 'ENTRY_NOT_FOUND',
    message: 'Entry not found',
  },
  ENTRY_NOT_AUTHORIZED: {
    code: 'ENTRY_NOT_AUTHORIZED',
    message: 'You do not have permission to access this entry',
  },

  // Drawer errors
  DRAWER_NOT_FOUND: {
    code: 'DRAWER_NOT_FOUND',
    message: 'Drawer not found',
  },
  DRAWER_NAME_EXISTS: {
    code: 'DRAWER_NAME_EXISTS',
    message: 'A drawer with this name already exists',
  },

  // Tag errors
  TAG_NOT_FOUND: {
    code: 'TAG_NOT_FOUND',
    message: 'Tag not found',
  },

  // Network errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'Request timeout',
  },

  // Generic errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized access',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access forbidden',
  },
} as const;