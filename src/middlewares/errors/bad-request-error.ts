import { CustomError } from './custom-error';

export class BadRequestError extends CustomError {
  statusCode = 400;

  constructor(
    public error:
      | string
      | {
          code: string;
          message: string;
          description?: string;
          imageUrl?: string;
        }
  ) {
    super(typeof error === 'string' ? error : 'Invalid request');
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeErrors() {
    return typeof this.error === 'string'
      ? [{ message: this.message }]
      : [{ ...this.error }];
  }
}
