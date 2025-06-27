import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './auth.controller';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
    })
      .overrideGuard(AuthGuard('google'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should exist and not throw', () => {
      expect(controller.googleAuth).toBeDefined();
      expect(() => controller.googleAuth({})).not.toThrow();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect to the dashboard', () => {
      const res = { redirect: jest.fn() } as unknown as Response;
      const req = {};

      controller.googleAuthRedirect(req, res);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3001/dashboard');
    });
  });
});
