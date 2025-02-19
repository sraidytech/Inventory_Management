export class ApiError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }

  static BadRequest(message: string, errors?: Record<string, string[]>) {
    return new ApiError(400, message, errors);
  }

  static Unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static Forbidden(message: string = 'Forbidden') {
    return new ApiError(403, message);
  }

  static NotFound(message: string = 'Resource not found') {
    return new ApiError(404, message);
  }

  static Conflict(message: string, errors?: Record<string, string[]>) {
    return new ApiError(409, message, errors);
  }

  static InternalServer(message: string = 'Internal server error') {
    return new ApiError(500, message);
  }
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    errors?: Record<string, string[]>;
  };
};

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(error: ApiError): ApiResponse<never> {
  return {
    success: false,
    error: {
      message: error.message,
      errors: error.errors,
    },
  };
}
