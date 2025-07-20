import { Test, TestingModule } from '@nestjs/testing';
import { AlpacaController } from './alpaca.controller';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

describe('AlpacaController', () => {
  let controller: AlpacaController;

  const mockAuthenticatedGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlpacaController],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue(mockAuthenticatedGuard)
      .compile();

    controller = module.get<AlpacaController>(AlpacaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProtected', () => {
    it('should return a welcome message with the user email', () => {
      const req = { user: { email: 'test@example.com' } };
      const result = controller.getProtected(req);
      expect(result.message).toBe(
        'Hello, test@example.com! You are authenticated.',
      );
    });

    it('should return a generic welcome message if user email is not present', () => {
      const req = { user: {} };
      const result = controller.getProtected(req);
      expect(result.message).toBe('Hello, user! You are authenticated.');
    });

    it('should return a generic welcome message if user is not present', () => {
      const req = {};
      const result = controller.getProtected(req);
      expect(result.message).toBe('Hello, user! You are authenticated.');
    });
  });
});
