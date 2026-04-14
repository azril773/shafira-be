import { Request } from 'express';
import { validationResult } from 'express-validator';
import { HttpStatusCodeLiteral, TsoaResponse, ValidateError } from 'tsoa';

export class BaseCustomError extends Error {
  constructor(message: string) {
    super(message);
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    // This line is needed to make the stack trace work correctly
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EntityNotFoundError extends BaseCustomError {
  constructor(entityName: string, filter: Record<string, unknown>) {
    super(`${entityName} not found with filter ${JSON.stringify(filter)}`);
  }
}

export class JSONError extends BaseCustomError {
  constructor(functionName: string, error: unknown) {
    if (error instanceof Error) {
      super(`Error JSON ${functionName}: ${error.message}`);
    } else {
      super(`Error JSON ${functionName}`);
    }
  }
}

export class UnauthorizedError extends BaseCustomError {
  constructor(message: string = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenError extends BaseCustomError {
  constructor(message: string = 'Forbidden') {
    super(message);
  }
}

export const constructValidateError = (message: string): ValidateError => {
  return new ValidateError({ 'body.name': { message } }, message);
};

export const validateRequest = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw constructValidateError(JSON.stringify(errors.array()));
};

export const handleControllerError = (
  error: unknown,
  {
    defaultErrorResponse,
  }: {
    defaultErrorResponse: TsoaResponse<HttpStatusCodeLiteral, { message: string }>;
  },
): unknown => {
  if (error instanceof ValidateError) {
    // will be handled on app.ts
    throw error;
  }
  if (error instanceof EntityNotFoundError) {
    return defaultErrorResponse(404, { message: error.message });
  }
  if (error instanceof JSONError) {
    return defaultErrorResponse(400, { message: error.message });
  }
  if (error instanceof UnauthorizedError) {
    return defaultErrorResponse(401, { message: error.message });
  }
  if (error instanceof ForbiddenError) {
    return defaultErrorResponse(403, { message: error.message });
  }
  if (error instanceof Error) {
    console.error(error.stack);
    return defaultErrorResponse(500, { message: error.message });
  }
  return defaultErrorResponse(500, { message: 'An unexpected error occurred' });
};

