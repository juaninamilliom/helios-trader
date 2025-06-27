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
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
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
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      const result = await service.validateUser(userDetails);
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userDetails.email },
      });
    });

    it('should create and return a new user if not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const result = await service.validateUser(userDetails);
      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: userDetails });
    });

    it('should throw an error if prisma throws an error', async () => {
      const error = new Error('Database error');
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(error);
      await expect(service.validateUser(userDetails)).rejects.toThrow(error);
    });
  });
});
