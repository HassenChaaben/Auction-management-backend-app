import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, ValidationError } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle AppError instances and return corresponding status and formatted error', () => {
    const appError = new AppError('Operational failure', 400);

    errorHandler(appError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      status: 400,
      message: 'Operational failure',
    });
  });

  it('should handle ValidationError with structured field errors', () => {
    const fieldErrors = [{ field: 'email', message: 'Invalid email' }];
    const validationError = new ValidationError('Validation failed', fieldErrors);

    errorHandler(validationError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      status: 422,
      message: 'Validation failed',
      errors: fieldErrors,
    });
  });

  it('should default to 500 status and log error for generic unhandled errors', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const genericError = new Error('Database crash');

    errorHandler(genericError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      status: 500,
      message: 'Internal server error',
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
