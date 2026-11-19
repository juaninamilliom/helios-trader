import { Store, SessionData } from 'express-session';
import { FinanceDatabase } from './database';
import { Prisma } from '@prisma/client';
export class PostgresSessionStore extends Store {
  constructor(private readonly db: FinanceDatabase) {
    super();
  }
  get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void,
  ) {
    void this.db.financeSession
      .findUnique({ where: { id: sid } })
      .then((row) =>
        callback(
          null,
          row && row.expiresAt > new Date()
            ? (row.payload as unknown as SessionData)
            : null,
        ),
      )
      .catch(callback);
  }
  set(sid: string, session: SessionData, callback?: (err?: unknown) => void) {
    const data = {
      payload: JSON.parse(JSON.stringify(session)) as Prisma.InputJsonValue,
      expiresAt: new Date(session.cookie.expires || Date.now() + 3600000),
    };
    void this.db.financeSession
      .upsert({
        where: { id: sid },
        create: { id: sid, ...data },
        update: data,
      })
      .then(() => callback?.())
      .catch((e) => callback?.(e));
  }
  destroy(sid: string, callback?: (err?: unknown) => void) {
    void this.db.financeSession
      .deleteMany({ where: { id: sid } })
      .then(() => callback?.())
      .catch((e) => callback?.(e));
  }
}
