import { Schema } from "express-validator";
import { UUID } from "./common_type";
import { CANCELLED, PENDING, POSTED } from "@constants/status";

export type CreatePurchase = {
  productId: UUID;
  vendorId: UUID;
  purchaseDate: Date;
  qty: number;
};

export type ChangeStatusPurchase = {
  id: UUID;
  status: string;
};

export type UpdatePurchase = {
  productId?: UUID;
  vendorId?: UUID;
  purchaseDate?: Date;
  qty?: number;
};

export const createPurchaseSchema: Schema = {
  productId: {
    isUUID: true,
    notEmpty: true,
  },
  vendorId: {
    isUUID: true,
    notEmpty: true,
  },
  purchaseDate: {
    isISO8601: true,
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
  productId: {
    optional: { options: { values: "undefined" } },
    isUUID: true,
  },
  vendorId: {
    optional: { options: { values: "undefined" } },
    isUUID: true,
  },
  purchaseDate: {
    optional: { options: { values: "undefined" } },
    isISO8601: true,
  },
  qty: {
    optional: { options: { values: "undefined" } },
    isInt: {
      options: { min: 1 },
    },
  },
};
