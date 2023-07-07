import { PrismaClient } from '@prisma/client';

export enum LogLevelIndicators {
  one = 1,
  two = 2,
  three = 3,
  four = 4,
}

class PrismaWrapper {
  private _prisma?: PrismaClient;

  get prisma() {
    if (!this._prisma) {
      throw new Error('Cannot access database before connecting');
    }

    return this._prisma;
  }

  disconnect() {
    return this._prisma?.$disconnect().then((val) => {
      console.log('Disconnected from Postgres');
      return val;
    });
  }

  connect(logLevel: LogLevelIndicators): Promise<any> {
    this._prisma = new PrismaClient({
      //@ts-ignore
      log: ['error', 'warn', 'info', 'query'].splice(0, logLevel),
    });
    return new Promise((resolve, reject) => {
      try {
        return this._prisma?.$connect().then(() => {
          //   this._prisma?.$use(async (params, next) => {
          //     const result = await next(params);
          //     return result;
          //   });
          console.info('Connected to Postgres');
          resolve('Connected to Postgres');
        });
      } catch (err) {
        return reject(err);
      }
    });
  }
}

export const prismaWrapper = new PrismaWrapper();
