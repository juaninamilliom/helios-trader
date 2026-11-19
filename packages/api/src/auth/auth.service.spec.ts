/* eslint-disable @typescript-eslint/unbound-method -- Jest inspects mock calls; these references are never invoked without their receiver. */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    picture: 'test.jpg',
    createdAt: new Date(),
  };

  const userDetails = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    picture: 'test.jpg',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            findUserByEmail: jest.fn(),
            createUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return an existing user', async () => {
      jest.spyOn(prisma, 'findUserByEmail').mockResolvedValue(mockUser);
      const result = await service.validateUser(userDetails);
      expect(result).toEqual(mockUser);
      expect(prisma.findUserByEmail).toHaveBeenCalledWith(userDetails.email);
    });

    it('should create and return a new user if not found', async () => {
      jest.spyOn(prisma, 'findUserByEmail').mockResolvedValue(null);
      jest.spyOn(prisma, 'createUser').mockResolvedValue(mockUser);

      const result = await service.validateUser(userDetails);
      expect(result).toEqual(mockUser);
      expect(prisma.createUser).toHaveBeenCalledWith(userDetails);
    });

    it('should throw an error if prisma throws an error', async () => {
      const error = new Error('Database error');
      jest.spyOn(prisma, 'findUserByEmail').mockRejectedValue(error);
      await expect(service.validateUser(userDetails)).rejects.toThrow(error);
    });
  });
});
