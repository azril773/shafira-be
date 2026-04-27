import { Schema } from "express-validator";
import { UUID } from "./common_type";

export type TransactionDetailInput = {
  productId: UUID;
  priceName: string;
  qty: number;
};

export type CreateTransactionBody = {
  paymentMethod: string;
  cashAmount?: number;
  transactionDetails: TransactionDetailInput[];
};

export type RefundTransactionBody = {
  detailIds: UUID[];
  reason: string;
};

export const createTransactionSchema: Schema = {
  paymentMethod: {
    isString: true,
    notEmpty: true,
  },
  cashAmount: {
    optional: { options: { values: "undefined" } },
    isFloat: { options: { min: 0 } },
  },
  transactionDetails: {
    isArray: { options: { min: 1 } },
  },
  "transactionDetails.*.productId": {
    isUUID: true,
    notEmpty: true,
  },
  "transactionDetails.*.priceName": {
    isString: true,
    notEmpty: true,
  },
  "transactionDetails.*.qty": {
    isInt: { options: { min: 1 } },
  },
};

export const refundTransactionSchema: Schema = {
  detailIds: {
    isArray: { options: { min: 1 } },
  },
  "detailIds.*": {
    isUUID: true,
  },
  reason: {
    isString: true,
    notEmpty: true,
  },
};
