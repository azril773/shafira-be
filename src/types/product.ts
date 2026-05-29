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
  hpp: {
    optional: { options: { values: "undefined" } },
    isFloat: { options: { min: 0 } },
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
  "prices.*.promoPrice": {
    optional: { options: { values: "null" } },
    isFloat: { options: { min: 0 } },
  },
  "prices.*.promoStartDate": {
    optional: { options: { values: "null" } },
    isISO8601: true,
  },
  "prices.*.promoEndDate": {
    optional: { options: { values: "null" } },
    isISO8601: true,
  },
};

export type ProductBody = {
  name: string;
  prices: Price[];
  category: string;
  barcode: string;
  uomId?: UUID | null;
  hpp?: number;
};

export type UpdateStockBody = {
  stock: number;
  reason?: string;
};

export const updateStockSchema: Schema = {
  stock: {
    isInt: { options: { min: 0 } },
  },
  reason: {
    optional: { options: { values: "undefined" } },
    isString: true,
    escape: true,
    trim: true,
  },
};

export type Price = {
  name: string;
  price: number;
  promoPrice?: number | null;
  promoStartDate?: string | null;
  promoEndDate?: string | null;
};
