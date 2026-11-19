/* eslint-disable @typescript-eslint/unbound-method -- Jest inspects mock calls; these references are never invoked without their receiver. */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './auth.controller';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

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
      expect(() => controller.googleAuth()).not.toThrow();
    });
  });

  describe('googleAuthRedirect', () => {
    it('waits for persisted session login before redirecting', async () => {
      const res = { redirect: jest.fn() } as unknown as Response;
      let complete!: (error?: Error) => void;
      const req = {
        user: { id: 1 },
        logIn: jest.fn(
          (
            _user: unknown,
            _options: unknown,
            callback: (error?: Error) => void,
          ) => {
            complete = callback;
          },
        ),
      } as unknown as Request;
      const pending = controller.googleAuthRedirect(req, res);
      expect(req.logIn).toHaveBeenCalledWith(
        req.user,
        { session: true },
        expect.any(Function),
      );
      expect(res.redirect).not.toHaveBeenCalled();
      complete();
      await pending;
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/connected',
      );
    });
    it('propagates session-save errors without redirecting', async () => {
      const error = new Error('Synthetic session save failure');
      const res = { redirect: jest.fn() } as unknown as Response;
      const req = {
        user: { id: 1 },
        logIn: jest.fn(
          (
            _user: unknown,
            _options: unknown,
            callback: (error?: Error) => void,
          ) => callback(error),
        ),
      } as unknown as Request;
      await expect(controller.googleAuthRedirect(req, res)).rejects.toThrow(
        error,
      );
      expect(res.redirect).not.toHaveBeenCalled();
    });
    it('rejects a callback without a user', async () => {
      const res = { redirect: jest.fn() } as unknown as Response;
      const req = { logIn: jest.fn() } as unknown as Request;
      await expect(controller.googleAuthRedirect(req, res)).rejects.toThrow(
        'Google authentication did not return a user',
      );
      expect(req.logIn).not.toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });
});
