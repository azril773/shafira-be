import { Schema } from "express-validator";
import { UUID } from "./common_type";
import { arrayParamSchema, nonNegativeFloat, uuidParamSchema } from "./schema_type";

export type TransactionBody = {
  transactionDetails: TransactionMapDetail[]
};

export type TransactionMapDetail = {
  product_id: UUID
  qty: number
}

export const TransactionSchema: Schema = {
  transactionDetails: arrayParamSchema(false),
  "transactionDetails.*.product_id": uuidParamSchema(false),
  "transactionDetails.*.qty": nonNegativeFloat(false),
};
