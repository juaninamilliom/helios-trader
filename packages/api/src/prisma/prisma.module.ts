import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [
    PrismaService,
    {
      provide: PrismaClient,
      useFactory: () =>
        new PrismaClient({
          log: [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
        }),
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
