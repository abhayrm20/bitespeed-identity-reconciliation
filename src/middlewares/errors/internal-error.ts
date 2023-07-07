import { CustomError } from './custom-error';

export class InternalError extends CustomError {
  statusCode = 500;

  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, InternalError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
