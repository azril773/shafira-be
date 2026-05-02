import { Schema } from "express-validator";
import {
  ADMIN,
  CASHIER,
  INVENTORY_MANAGER,
  VERIF_ADMIN,
  USER_STATUS_APPROVED,
  USER_STATUS_PENDING,
  USER_STATUS_REJECTED,
} from "@constants/user";
import { UUID } from "./common_type";

export const ALLOWED_ROLES = [ADMIN, CASHIER, INVENTORY_MANAGER, VERIF_ADMIN];
export const ALLOWED_STATUSES = [
  USER_STATUS_PENDING,
  USER_STATUS_APPROVED,
  USER_STATUS_REJECTED,
];

export type CreateUserBody = {
  username: string;
  password: string;
  name?: string;
  role: string;
};

export type UpdateUserBody = {
  name?: string;
  role?: string;
  status?: string;
  password?: string;
};

export type ApproveUserBody = {
  role?: string;
  verifierUsername: string;
  verifierPassword: string;
  approve: boolean;
};

export type RegisterUserBody = {
  username: string;
  password: string;
  name?: string;
  role: string;
};

export const createUserSchema: Schema = {
  username: { isString: true, notEmpty: true, trim: true },
  password: { isString: true, isLength: { options: { min: 4 } } },
  name: { optional: { options: { values: "undefined" } }, isString: true },
  role: { isIn: { options: [ALLOWED_ROLES] } },
};

export const updateUserSchema: Schema = {
  name: { optional: { options: { values: "undefined" } }, isString: true },
  role: {
    optional: { options: { values: "undefined" } },
    isIn: { options: [ALLOWED_ROLES] },
  },
  status: {
    optional: { options: { values: "undefined" } },
    isIn: { options: [ALLOWED_STATUSES] },
  },
  password: {
    optional: { options: { values: "undefined" } },
    isString: true,
    isLength: { options: { min: 4 } },
  },
};

export const approveUserSchema: Schema = {
  approve: { isBoolean: true },
  role: {
    optional: { options: { values: "undefined" } },
    isIn: { options: [ALLOWED_ROLES] },
  },
  verifierUsername: { isString: true, notEmpty: true },
  verifierPassword: { isString: true, notEmpty: true },
};

export const registerUserSchema: Schema = {
  username: { isString: true, notEmpty: true, trim: true },
  password: { isString: true, isLength: { options: { min: 4 } } },
  name: { optional: { options: { values: "undefined" } }, isString: true },
  role: { isIn: { options: [ALLOWED_ROLES] } },
};

export type UserId = UUID;
