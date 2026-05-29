import { Schema } from "express-validator";
import { UUID } from "./common_type";

export type TransactionDetailInput = {
  productId: UUID;
  priceName: string;
  qty: number;
  uomId?: UUID | null;
};

export type PaymentInput = {
  method: string;
  amount: number;
  tendered?: number;
  reference?: string | null;
};

export type CreateTransactionBody = {
  paymentMethod?: string;
  cashAmount?: number;
  payments?: PaymentInput[];
  transactionDetails: TransactionDetailInput[];
};

export type RefundItemInput = {
  detailId: UUID;
  qty: number;
};

export type RefundTransactionBody = {
  items: RefundItemInput[];
  reason: string;
  verifierUsername?: string;
  verifierPassword?: string;
};

export type VoidTransactionBody = {
  reason?: string;
  verifierUsername?: string;
  verifierPassword?: string;
};

export const ALLOWED_PAYMENT_METHODS = [
  "Tunai",
  "QRIS",
  "Kartu Debit",
  "Transfer",
  "E-Wallet",
];
export const SPLIT_PAYMENT_LABEL = "SPLIT";

export const createTransactionSchema: Schema = {
  paymentMethod: {
    optional: { options: { values: "undefined" } },
    isString: true,
  },
  cashAmount: {
    optional: { options: { values: "undefined" } },
    isFloat: { options: { min: 0 } },
  },
  payments: {
    optional: { options: { values: "undefined" } },
    isArray: true,
  },
  "payments.*.method": {
    isString: true,
    notEmpty: true,
    isIn: { options: [ALLOWED_PAYMENT_METHODS] },
    errorMessage: "Metode pembayaran tidak valid.",
  },
  "payments.*.amount": {
    isFloat: { options: { min: 0 } },
  },
  "payments.*.tendered": {
    optional: { options: { values: "undefined" } },
    isFloat: { options: { min: 0 } },
  },
  "payments.*.reference": {
    optional: { options: { values: "null" } },
    isString: true,
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
    isFloat: { options: { min: 0.001 } },
  },
  "transactionDetails.*.uomId": {
    optional: { options: { values: "null" } },
    isUUID: true,
  },
};

export const refundTransactionSchema: Schema = {
  items: {
    isArray: { options: { min: 1 } },
  },
  "items.*.detailId": {
    isUUID: true,
  },
  "items.*.qty": {
    isFloat: { options: { min: 0.001 } },
  },
  reason: {
    isString: true,
    notEmpty: true,
  },
  verifierUsername: {
    optional: { options: { values: "undefined" } },
    isString: true,
  },
  verifierPassword: {
    optional: { options: { values: "undefined" } },
    isString: true,
  },
};

export const voidTransactionSchema: Schema = {
  reason: {
    optional: { options: { values: "undefined" } },
    isString: true,
  },
  verifierUsername: {
    optional: { options: { values: "undefined" } },
    isString: true,
  },
  verifierPassword: {
    optional: { options: { values: "undefined" } },
    isString: true,
  },
};
