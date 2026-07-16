import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateJWT, authorizeRole, JwtPayload } from '../../src/middleware/auth';
import { UnauthorizedError, ForbiddenError } from '../../src/middleware/errorHandler';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware Unit Tests', () => {
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

  describe('authenticateJWT', () => {
    it('should throw UnauthorizedError if authorization header is missing', () => {
      mockRequest.headers = {};
      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should throw UnauthorizedError if token is malformed', () => {
      mockRequest.headers = { authorization: 'Bearer' };
      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should verify token and set req.user if valid', () => {
      const decodedPayload: JwtPayload = { id: 1n, role: 'bid-participant' };
      mockRequest.headers = { authorization: 'Bearer valid_token' };
      
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(decodedPayload);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should throw UnauthorizedError if token verification fails', () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('authorizeRole', () => {
    it('should call next with no error if user role is authorized', () => {
      mockRequest.user = { id: 1n, role: 'admin' };
      const middleware = authorizeRole('admin', 'bid-creator');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should throw ForbiddenError if user role is not authorized', () => {
      mockRequest.user = { id: 1n, role: 'bid-participant' };
      const middleware = authorizeRole('admin', 'bid-creator');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should throw UnauthorizedError if req.user is missing', () => {
      const middleware = authorizeRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});
