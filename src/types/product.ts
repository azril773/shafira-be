import { Schema } from "express-validator";

export const productSchema: Schema = {
  name: {
    isString: true,
    escape: true,
    trim: true,
    notEmpty: true,
  },
  price: {
    isDecimal: true,
    toFloat: true,
    notEmpty: true,
  },
  category: {
    isString: true,
    escape: true,
    trim: true,
    notEmpty: true,
  },
  barcode: {
    isString: true,
    escape: true,
    trim: true,
    notEmpty: true,
  },
};

export type ProductBody = {
  name: string;
  price: number;
  category: string;
  barcode: string;
};
