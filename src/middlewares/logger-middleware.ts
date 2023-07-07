import { Handler } from 'express';
import morgan, { StreamOptions } from 'morgan';
import { Logger } from 'winston';
import { InternalError } from '../errors/internal-error';
import { loggerInstance } from '../services/custom-logger';
import { middlewareLogLevels } from '../types/enums';
import { Express } from 'express';

const stream: StreamOptions = {
  write: (message) => loggerInstance.http(message),
};

// @ts-ignore
morgan.token('body', (req, res) => JSON.stringify(req['body'] || ''));

export const loggerMiddleWare = morgan(
  ':method :url :status :body :res[content-length] - :response-time ms',
  { stream }
);

export class LoggerMiddleware {
  private _logger: Handler;

  private addReqAndResBodyToken(
    reqBody: string = 'reqBody',
    resBody: string = 'resBody'
  ) {
    // @ts-ignore
    morgan.token(reqBody, (req, res) => JSON.stringify(req['body'] || ''));
    // @ts-ignore
    morgan.token(resBody, (req, res) => JSON.stringify(res[resBody] || ''));
  }
  private changeSendAndJsonMethods(app: Express, resBodyString: string) {
    const originalSend = app.response.send;
    //@ts-ignore
    app.response.send = function sendOverWrite(body) {
      originalSend.call(this, body);
      //@ts-ignore
      this[resBodyString] = body;
    };

    const originalJson = app.response.json;
    //@ts-ignore
    app.response.json = function jsonOverWrite(body) {
      originalJson.call(this, body);
      //@ts-ignore
      this[resBodyString] = body;
    };
  }

  constructor(
    subject: 'req' | 'res' | 'combined',
    level: middlewareLogLevels,
    requestIdHeader: string = 'x-request-id',
    app?: Express
  ) {
    if (level === middlewareLogLevels.info) {
      if (subject === 'req')
        // @ts-ignore
        this._logger = morgan(
          `[REQ] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent`,
          { immediate: true, stream }
        );
      else if (subject === 'res')
        // @ts-ignore
        this._logger = morgan(
          `[RES] :req[${requestIdHeader}] -- :method :url :status :res[content-length] :response-time :total-time`,
          { stream }
        );
      else {
        // @ts-ignore
        this._logger = morgan(
          `[COM] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent | :status :res[content-length] :response-time :total-time`,
          { stream }
        );
      }
    } else {
      const reqBodyString = 'reqBody',
        resBodyString = 'resBody';

      if (app) this.changeSendAndJsonMethods(app, resBodyString);

      this.addReqAndResBodyToken(reqBodyString, resBodyString);

      if (subject === 'req')
        // @ts-ignore
        this._logger = morgan(
          `[REQ] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent :req[Authorization] :${reqBodyString}`,
          { immediate: true, stream }
        );
      else if (subject === 'res')
        // @ts-ignore
        this._logger = morgan(
          `[RES] :req[${requestIdHeader}] -- :method :url :status :res[content-length] :${resBodyString} :response-time :total-time`,
          { stream }
        );
      else {
        // @ts-ignore
        this._logger = morgan(
          `[COM] :req[${requestIdHeader}] -- :method :url HTTP/:http-version :remote-addr :user-agent :req[Authorization] :${reqBodyString} | :status :res[content-length] :${resBodyString} :response-time :total-time`,
          { stream }
        );
      }
    }
  }

  get logger() {
    if (!this._logger)
      throw new InternalError('Error Initializing Logger middleware');
    return this._logger;
  }
}
