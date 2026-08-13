import { Schema } from "express-validator";
import { UUID } from "./common_type";

export type SuspendedCartItem = {
  id: UUID;
  name: string;
  category: string;
  barcode: string;
  priceLabel: string;
  priceName: string;
  price: number;
  originalPrice?: number;
  isPromo?: boolean;
  stock: number;
  uomId?: UUID | null;
  uomCode?: string | null;
  uomName?: string | null;
  qty: number;
  key: string;
};

export type CreateSuspendedCartBody = {
  label?: string;
  items: SuspendedCartItem[];
};

export type ResumeSuspendedCartBody = {
  currentItems?: SuspendedCartItem[];
};

const itemSchema: Schema = {
  "items.*.id": {
    isUUID: true,
  },
  "items.*.name": {
    isString: true,
    notEmpty: true,
  },
  "items.*.category": {
    isString: true,
  },
  "items.*.barcode": {
    isString: true,
  },
  "items.*.priceLabel": {
    isString: true,
    notEmpty: true,
  },
  "items.*.priceName": {
    isString: true,
    notEmpty: true,
  },
  "items.*.price": {
    isFloat: { options: { min: 0 } },
  },
  "items.*.originalPrice": {
    optional: { options: { values: "undefined" } },
    isFloat: { options: { min: 0 } },
  },
  "items.*.isPromo": {
    optional: { options: { values: "undefined" } },
    isBoolean: true,
  },
  "items.*.stock": {
    isFloat: { options: { min: 0 } },
  },
  "items.*.uomId": {
    optional: { options: { values: "null" } },
    isUUID: true,
  },
  "items.*.uomCode": {
    optional: { options: { values: "null" } },
    isString: true,
  },
  "items.*.uomName": {
    optional: { options: { values: "null" } },
    isString: true,
  },
  "items.*.qty": {
    isFloat: { options: { min: 0.001 } },
  },
  "items.*.key": {
    isString: true,
    notEmpty: true,
  },
};

export const createSuspendedCartSchema: Schema = {
  label: {
    optional: { options: { values: "undefined" } },
    isString: true,
    trim: true,
    isLength: { options: { max: 255 } },
  },
  items: {
    isArray: { options: { min: 1 } },
  },
  ...itemSchema,
};

export const resumeSuspendedCartSchema: Schema = {
  currentItems: {
    optional: { options: { values: "undefined" } },
    isArray: true,
  },
  ...Object.fromEntries(
    Object.entries(itemSchema).map(([key, value]) => [
      key.replace(/^items/, "currentItems"),
      { ...value, optional: { options: { values: "undefined" } } },
    ]),
  ),
};
