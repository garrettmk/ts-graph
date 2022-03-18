/**
 * A base class for custom error types. Allows for checking using `instanceof()`.
 * 
 * Example:
 * ```typescript
 * class CustomError extends SubclassedError {};
 * 
 * const basicError = new Error();
 * const customError = new CustomError();
 * 
 * basicError instanceof Error;        // true
 * customError instanceof Error;       // true
 * customError instanceof CustomError; // true
 * basicError instanceof CustomError;  // false
 * ```
 */
export class SubclassedError extends Error {
  constructor(message?: string) {
    super();
    this.name = this.constructor.name;
    this.message = message ? `${this.name}: ${message}` : this.name;

    // @ts-ignore
    if (typeof Error.captureStackTrace === 'function') {
      // @ts-ignore
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}


export class NotImplementedError extends SubclassedError {};
export class NotFoundError extends SubclassedError {};
export class AlreadyExistsError extends SubclassedError {};

export class ValidationError extends SubclassedError {
  /** The path to the offending field, as an array of property keys. */
  public path: string[];
  /** Values or types that would have been acceptable. */
  public expected: string | string[];
  /** The offending value. */
  public recieved: any;

  constructor(message: string, path: string[], expected: string | string[], recieved: any) {
    super(message);
    this.path = path;
    this.expected = expected;
    this.recieved = recieved;
  }
};

