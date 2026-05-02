import { Schema } from "express-validator";

export type UomBody = {
  code: string;
  name: string;
  description?: string | null;
};

export const uomSchema: Schema = {
  code: {
    isString: true,
    trim: true,
    notEmpty: true,
  },
  name: {
    isString: true,
    trim: true,
    notEmpty: true,
  },
  description: {
    optional: { options: { values: "null" } },
    isString: true,
    trim: true,
  },
};
