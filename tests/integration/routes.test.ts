import request from 'supertest';
import app from '../../src/app';
import { User, Wallet } from '../../src/models/index';
import jwt from 'jsonwebtoken';

// Mock the models
jest.mock('../../src/models/index', () => {
  return {
    User: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
    Wallet: {
      create: jest.fn(),
    },
  };
});

describe('API Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 and server status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully and return 201', async () => {
      const mockUserData = {
        id: 123n,
        uuid: 'd8a87c1f-49b2-4d2c-8153-f725a3d76e4c',
        username: 'testuser',
        email: 'test@example.com',
        role: 'bid-participant',
        createdAt: new Date().toISOString(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUserData);
      (Wallet.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password1',
          role: 'bid-participant',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should fail with 422 if username or email is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          password: 'Password1',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });
});
