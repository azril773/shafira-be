import type { HttpStatusCodeLiteral } from 'tsoa';

export const RES_CODE: Record<string, HttpStatusCodeLiteral> = {
  SUCCESS: 200,
  CREATED: 201,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION_FAILED: 422,
  SERVER_ERROR: 500,
  JSON_ERROR: 400,
};

export const RES_MSG = {
  [RES_CODE.SUCCESS]: 'Success',
  [RES_CODE.CREATED]: 'Created',
  [RES_CODE.NOT_FOUND]: 'Not Found',
  [RES_CODE.UNAUTHORIZED]: 'Unauthorized',
  [RES_CODE.FORBIDDEN]: 'Forbidden',
  [RES_CODE.VALIDATION_FAILED]: 'Validation Failed',
  [RES_CODE.SERVER_ERROR]: 'Internal Server Error',
  [RES_CODE.JSON_ERROR]: 'JSON Error',
};
