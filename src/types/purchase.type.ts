import { Schema } from "express-validator";
import { UUID } from "./common_type";
import { CANCELLED, PENDING, POSTED } from "@constants/status";

export type CreatePurchase = {
  product_id: UUID;
  vendor_id: UUID;
  purchase_date: Date;
  qty: number;
};

export type ChangeStatusPurchase = {
  id: UUID;
  status: string;
};

export type UpdatePurchase = {
  product_id?: UUID;
  vendor_id?: UUID;
  purchase_date?: Date;
  qty?: number;
};

export const createPurchaseSchema: Schema = {
  product_id: {
    isUUID: true,
    notEmpty: true,
  },
  vendor_id: {
    isUUID: true,
    notEmpty: true,
  },
  purchase_date: {
    isDate: true,
    notEmpty: true,
  },
  qty: {
    isInt: {
      options: { min: 1 },
    },
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
  product_id: {
    optional: { options: { values: "undefined" } },
    isUUID: true,
  },
  vendor_id: {
    optional: { options: { values: "undefined" } },
    isUUID: true,
  },
  purchase_date: {
    optional: { options: { values: "undefined" } },
    isDate: true,
  },
  qty: {
    optional: { options: { values: "undefined" } },
    isInt: {
      options: { min: 1 },
    },
  },
};
