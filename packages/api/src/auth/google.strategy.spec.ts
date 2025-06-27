import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    picture: 'test.jpg',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GOOGLE_CLIENT_ID') return 'test_client_id';
              if (key === 'GOOGLE_CLIENT_SECRET') return 'test_client_secret';
              if (key === 'GOOGLE_CALLBACK_URL') return 'test_callback_url';
              return null;
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return the user', async () => {
      const profile = {
        name: { givenName: 'Test', familyName: 'User' },
        emails: [{ value: 'test@example.com' }],
        photos: [{ value: 'test.jpg' }],
      };
      const done = jest.fn();

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);

      await strategy.validate(null, 'accessToken', 'refreshToken', profile, done);

      expect(authService.validateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        picture: 'test.jpg',
      });
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });
  });
});
