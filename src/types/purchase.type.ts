import { Schema } from "express-validator";
import { UUID } from "./common_type";
import { CANCELLED, PENDING, POSTED } from "@constants/status";

export type PurchaseDetailInput = {
  productId: UUID;
  qty: number;
  purchasePrice: number;
};

export type CreatePurchase = {
  vendorId: UUID;
  purchaseDate: Date;
  details: PurchaseDetailInput[];
};

export type ChangeStatusPurchase = {
  id: UUID;
  status: string;
};

export type UpdatePurchase = {
  vendorId?: UUID;
  purchaseDate?: Date;
  details?: PurchaseDetailInput[];
};

export const createPurchaseSchema: Schema = {
  vendorId: {
    isUUID: true,
    notEmpty: true,
  },
  purchaseDate: {
    isISO8601: true,
    notEmpty: true,
  },
  details: {
    isArray: {
      options: { min: 1 },
      errorMessage: "Setidaknya harus ada satu produk pada pembelian.",
    },
  },
  "details.*.productId": {
    isUUID: true,
    notEmpty: true,
  },
  "details.*.qty": {
    isInt: { options: { min: 1 } },
    notEmpty: true,
  },
  "details.*.purchasePrice": {
    isFloat: { options: { min: 0 } },
    notEmpty: true,
  },
};

export const changeStatusPurchaseSchema: Schema = {
  id: {
    isUUID: true,
    notEmpty: true,
  },
  status: {
    isIn: {
      options: [[PENDING, POSTED, CANCELLED]],
    },
    notEmpty: true,
  },
};

export const updatePurchaseSchema: Schema = {
  vendorId: {
    optional: { options: { values: "undefined" } },
    isUUID: true,
  },
  purchaseDate: {
    optional: { options: { values: "undefined" } },
    isISO8601: true,
  },
  details: {
    optional: { options: { values: "undefined" } },
    isArray: { options: { min: 1 } },
  },
  "details.*.productId": {
    optional: { options: { values: "undefined" } },
    isUUID: true,
  },
  "details.*.qty": {
    optional: { options: { values: "undefined" } },
    isInt: { options: { min: 1 } },
  },
  "details.*.purchasePrice": {
    optional: { options: { values: "undefined" } },
    isFloat: { options: { min: 0 } },
  },
};
