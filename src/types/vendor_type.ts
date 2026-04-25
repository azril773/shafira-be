import { Schema } from "express-validator";

export const vendorSchema: Schema = {
  name: {
    isString: true,
    trim: true,
    escape: true,
  },
  phone: {
    isString: true,
    trim: true,
    escape: true,
  },
};

export const vendorUpdateSchema: Schema = {
  name: {
    isString: true,
    trim: true,
    escape: true,
    optional: { options: { values: "undefined" } },
  },
  phone: {
    isString: true,
    trim: true,
    escape: true,
    optional: { options: { values: "undefined" } },
  },
};

export type VendorBody = {
  name: string;
  phone: string;
};