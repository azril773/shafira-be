import { Schema } from "express-validator";
import { UUID } from "./common_type";

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
  uomId: {
    optional: { options: { values: "null" } },
    isUUID: true,
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
  uomId?: UUID | null;
};

export type Price = {
  name: string;
  price: number;
};
