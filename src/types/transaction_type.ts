import { Schema } from "express-validator";
import { UUID } from "./common_type";

export type TransactionDetailInput = {
  productId: UUID;
  priceName: string;
  qty: number;
  uomId?: UUID | null;
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

const ALLOWED_PAYMENT_METHODS = ["Tunai", "QRIS", "Kartu Debit"];

export const createTransactionSchema: Schema = {
  paymentMethod: {
    isString: true,
    notEmpty: true,
    isIn: { options: [ALLOWED_PAYMENT_METHODS] },
    errorMessage: "Metode pembayaran tidak valid.",
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
  "transactionDetails.*.uomId": {
    optional: { options: { values: "null" } },
    isUUID: true,
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
