import {
  Injectable,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { type ProviderTransaction } from './domain';
export type ProviderAccount = {
  account_id: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  balances: {
    current: number | null;
    available: number | null;
    iso_currency_code: string | null;
  };
};
export type SyncPage = {
  added: ProviderTransaction[];
  modified: ProviderTransaction[];
  removed: { transaction_id: string }[];
  next_cursor: string;
  has_more: boolean;
  transactions_update_status?: string;
};
export class UpstreamError extends BadGatewayException {
  constructor(public readonly code: string) {
    super({
      message:
        'Account provider request failed. Retry or reconnect if requested.',
      code,
    });
  }
}
@Injectable()
export class PlaidProvider {
  constructor(private readonly config: ConfigService) {}
  get environment() {
    return this.config.get<string>('PLAID_ENV') || 'sandbox';
  }
  get configured() {
    return (
      !!this.config.get<string>('PLAID_CLIENT_ID') &&
      !!this.config.get<string>('PLAID_SECRET')
    );
  }
  private host() {
    const override = this.config.get<string>('PLAID_BASE_URL');
    if (override) {
      if (
        process.env.NODE_ENV === 'production' ||
        this.config.get('PROVIDER_TEST_MODE') !== 'true' ||
        !/^http:\/\/(127\.0\.0\.1|localhost):\d+(\/.*)?$/.test(override)
      )
        throw new Error(
          'Provider override is restricted to explicit local tests',
        );
      return override.replace(/\/$/, '');
    }
    // This milestone is sandbox-only. Production account access requires a separate release review.
    if (this.environment !== 'sandbox')
      throw new ServiceUnavailableException(
        'Only Plaid Sandbox is enabled in this milestone',
      );
    return 'https://sandbox.plaid.com';
  }
  async call<T>(path: string, data: object): Promise<T> {
    if (!this.configured)
      throw new ServiceUnavailableException(
        'Configure PLAID_CLIENT_ID and PLAID_SECRET to use Plaid Sandbox',
      );
    try {
      const response = await fetch(`${this.host()}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Plaid-Version': '2020-09-14',
        },
        body: JSON.stringify({
          client_id: this.config.get<string>('PLAID_CLIENT_ID'),
          secret: this.config.get<string>('PLAID_SECRET'),
          ...data,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          error_code?: string;
        };
        throw new UpstreamError(result.error_code || `HTTP_${response.status}`);
      }
      return (await response.json()) as T;
    } catch (e) {
      if (
        e instanceof UpstreamError ||
        e instanceof ServiceUnavailableException
      )
        throw e;
      throw new UpstreamError('PROVIDER_UNAVAILABLE');
    }
  }
}
@Injectable()
export class TokenVault {
  constructor(private readonly config: ConfigService) {}
  private key() {
    const value = this.config.get<string>('FINANCE_TOKEN_KEY') || '';
    if (!/^[a-f\d]{64}$/i.test(value))
      throw new ServiceUnavailableException(
        'FINANCE_TOKEN_KEY must be a 32-byte hex key',
      );
    return Buffer.from(value, 'hex');
  }
  assertConfigured() {
    this.key();
  }
  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    return [
      iv.toString('hex'),
      cipher.getAuthTag().toString('hex'),
      encrypted.toString('hex'),
    ].join('.');
  }
  decrypt(value: string) {
    const [iv, tag, text] = value.split('.');
    const cipher = createDecipheriv(
      'aes-256-gcm',
      this.key(),
      Buffer.from(iv, 'hex'),
    );
    cipher.setAuthTag(Buffer.from(tag, 'hex'));
    return Buffer.concat([
      cipher.update(Buffer.from(text, 'hex')),
      cipher.final(),
    ]).toString('utf8');
  }
}
export { CategoryInference } from './inference';
