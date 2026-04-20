import { ParamSchema } from "express-validator";


export const dateParamSchema = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    isISO8601: { errorMessage: 'Field must be a valid date' },
  };
};

export const booleanParamSchema = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    isBoolean: { errorMessage: 'Field must be a boolean' },
  };
};

export const stringParamSchema = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    trim: true,
    escape: true,
    isString: { errorMessage: 'Field must be a string' },
    isLength: { options: { min: 1, max: 255 }, errorMessage: 'Field must be between 1 and 255 characters' },
  };
};


export const arrayParamSchema = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    isArray: { errorMessage: 'Field must be an array' },
  };
};

export const uuidParamSchema = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    trim: true,
    escape: true,
    isUUID: { errorMessage: 'Field must be a valid UUID' },
  };
};

export const decimalParamSchema = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    isDecimal: { errorMessage: 'Field must be a valid decimal' },
  };
};

export const nonNegativeFloat = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    isFloat: { options: { min: 0 }, errorMessage: 'Field must be a valid float >= 0' },
  };
};

export const integerParamSchema = (nullable: boolean): ParamSchema => {
  return {
    optional: { options: { values: nullable ? 'null' : 'undefined' } },
    isInt: { errorMessage: 'Field must be a valid integer' },
  };
};
