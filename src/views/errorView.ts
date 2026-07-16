/**
 * Error View — serializes clean JSON error responses for all API errors.
 * Ensures a consistent error envelope across the entire application.
 */
export interface ErrorResponse {
  success: false;
  status: number;
  message: string;
  errors?: unknown;
}

/**
 * Formats an error into the standard JSON error response envelope.
 */
export function formatError(
  status: number,
  message: string,
  errors?: unknown
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    status,
    message,
  };

  if (errors !== undefined) {
    response.errors = errors;
  }

  return response;
}
