import { Schema } from "express-validator";

export const productSchema: Schema = {
  name: {
    isString: true,
    escape: true,
    trim: true,
    notEmpty: true,
  },
  prices: {
    isArray: true,
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
  "prices.*.price": {
    isInt: { options: { min: 0 } },
  },
  "prices.*.name": {
    isString: true,
    escape: true,
    trim: true,
    notEmpty: true,
  },
};

export type ProductBody = {
  name: string;
  prices: Price[];
  category: string;
  barcode: string;
};

export type Price = {
  name: string;
  price: number;
};
