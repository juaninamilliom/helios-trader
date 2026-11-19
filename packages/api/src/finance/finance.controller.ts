import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { FinanceService } from './finance.service';
import { PlaidProvider, CategoryInference } from './providers';
type UserRequest = Request & { user: { id: number } };
function stringField(body: unknown, key: string) {
  if (
    !body ||
    typeof body !== 'object' ||
    typeof (body as Record<string, unknown>)[key] !== 'string' ||
    !(body as Record<string, string>)[key] ||
    (body as Record<string, string>)[key].length > 500
  )
    throw new BadRequestException(`Invalid ${key}`);
  return (body as Record<string, string>)[key];
}
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly service: FinanceService,
    private readonly config: ConfigService,
    private readonly plaid: PlaidProvider,
    private readonly inference: CategoryInference,
  ) {}
  private mutation(req: Request) {
    const expected = new URL(
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001',
    ).origin;
    if (req.get('origin') !== expected)
      throw new ForbiddenException('Mutation origin is not allowed');
  }
  @Get('capabilities') capabilities() {
    return {
      plaidConfigured: this.plaid.configured,
      environment: this.plaid.environment,
      inferenceConfigured: this.inference.configured,
      model: this.inference.model,
      recipient: this.inference.recipient,
      moneyMovement: false,
    };
  }
  @Get('snapshot') @UseGuards(AuthenticatedGuard) snapshot(
    @Req() req: UserRequest,
  ) {
    return this.service.snapshot(req.user.id);
  }
  @Post('link-token') @UseGuards(AuthenticatedGuard) link(
    @Req() req: UserRequest,
  ) {
    this.mutation(req);
    return this.service.createLink(req.user.id);
  }
  @Post('exchange') @UseGuards(AuthenticatedGuard) exchange(
    @Req() req: UserRequest,
    @Body() body: unknown,
  ) {
    this.mutation(req);
    return this.service.exchange(req.user.id, stringField(body, 'publicToken'));
  }
  @Post('connections/:id/sync') @UseGuards(AuthenticatedGuard) sync(
    @Req() req: UserRequest,
    @Param('id') id: string,
  ) {
    this.mutation(req);
    return this.service.sync(req.user.id, id);
  }
  @Post('connections/:id/disconnect') @UseGuards(AuthenticatedGuard) disconnect(
    @Req() req: UserRequest,
    @Param('id') id: string,
  ) {
    this.mutation(req);
    return this.service.disconnect(req.user.id, id);
  }
  @Post('transactions/:id/category') @UseGuards(AuthenticatedGuard) correct(
    @Req() req: UserRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    this.mutation(req);
    return this.service.correct(req.user.id, id, stringField(body, 'category'));
  }
  @Post('ai-consent') @UseGuards(AuthenticatedGuard) consent(
    @Req() req: UserRequest,
    @Body() body: { consent?: unknown },
  ) {
    this.mutation(req);
    if (typeof body?.consent !== 'boolean')
      throw new BadRequestException('consent must be a boolean');
    return this.service.consent(req.user.id, body.consent);
  }
  @Post('classify') @UseGuards(AuthenticatedGuard) infer(
    @Req() req: UserRequest,
  ) {
    this.mutation(req);
    return this.service.infer(req.user.id);
  }
}
