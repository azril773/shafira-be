import { Schema } from "express-validator";
import { UUID } from "./common_type";

export const AUDIT_VOID_ITEM = "VOID_ITEM";
export const AUDIT_ABORT_SALE = "ABORT_SALE";
export const AUDIT_VOID_TRX = "VOID_TRX";
export const AUDIT_REFUND_TRX = "REFUND_TRX";

export const AUDIT_ACTIONS = [
  AUDIT_VOID_ITEM,
  AUDIT_ABORT_SALE,
  AUDIT_VOID_TRX,
  AUDIT_REFUND_TRX,
];

export type CreateAuditLogBody = {
  action: string;
  verifierUsername?: string;
  verifierPassword?: string;
  entityType?: string | null;
  entityId?: UUID | null;
  reason?: string | null;
  payload?: unknown;
};

export const createAuditLogSchema: Schema = {
  action: {
    isIn: { options: [AUDIT_ACTIONS] },
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
  entityType: {
    optional: { options: { values: "null" } },
    isString: true,
  },
  entityId: {
    optional: { options: { values: "null" } },
    isUUID: true,
  },
  reason: {
    optional: { options: { values: "null" } },
    isString: true,
  },
};
