/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VendorController } from './controllers/vendor.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TransactionController } from './controllers/transaction.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PurchaseController } from './controllers/purchase.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProductController } from './controllers/product.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './controllers/auth.controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "UUID": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"value":"[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "User": {
        "dataType": "refObject",
        "properties": {
            "id": {"ref":"UUID","required":true},
            "username": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "role": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Vendor": {
        "dataType": "refObject",
        "properties": {
            "createdById": {"dataType":"string","required":true},
            "createdBy": {"ref":"User"},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedById": {"dataType":"string","required":true},
            "updatedBy": {"ref":"User"},
            "updatedAt": {"dataType":"datetime","required":true},
            "id": {"ref":"UUID","required":true},
            "name": {"dataType":"string","required":true},
            "phone": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VendorBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"phone":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Transaction": {
        "dataType": "refObject",
        "properties": {
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "id": {"ref":"UUID","required":true},
            "cashierId": {"ref":"UUID","required":true},
            "cashier": {"ref":"User"},
            "transactionDetails": {"dataType":"array","array":{"dataType":"refObject","ref":"TransactionDetail"}},
            "transactionNo": {"dataType":"string","required":true},
            "totalPrice": {"dataType":"double","required":true},
            "totalQty": {"dataType":"double","required":true},
            "status": {"dataType":"string","required":true},
            "paymentMethod": {"dataType":"string","required":true},
            "cashAmount": {"dataType":"double","required":true},
            "changeAmount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Product": {
        "dataType": "refObject",
        "properties": {
            "id": {"ref":"UUID","required":true},
            "name": {"dataType":"string","required":true},
            "code": {"dataType":"string","required":true},
            "category": {"dataType":"string","required":true},
            "barcode": {"dataType":"string","required":true},
            "prices": {"dataType":"array","array":{"dataType":"refObject","ref":"PriceProduct"},"required":true},
            "stock": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PriceProduct": {
        "dataType": "refObject",
        "properties": {
            "id": {"ref":"UUID","required":true},
            "productId": {"ref":"UUID","required":true},
            "product": {"ref":"Product"},
            "name": {"dataType":"string","required":true},
            "price": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionDetail": {
        "dataType": "refObject",
        "properties": {
            "id": {"ref":"UUID","required":true},
            "transactionId": {"ref":"UUID","required":true},
            "transaction": {"ref":"Transaction"},
            "historicalName": {"dataType":"string","required":true},
            "historicalBarcode": {"dataType":"string","required":true},
            "historicalCode": {"dataType":"string","required":true},
            "historicalPriceName": {"dataType":"string","required":true},
            "historicalPrice": {"dataType":"double","required":true},
            "historicalCategory": {"dataType":"string","required":true},
            "productId": {"ref":"UUID","required":true},
            "product": {"ref":"Product"},
            "isRefund": {"dataType":"boolean","required":true},
            "refundReason": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "qty": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TransactionDetailInput": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"qty":{"dataType":"double","required":true},"priceName":{"dataType":"string","required":true},"productId":{"ref":"UUID","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTransactionBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"transactionDetails":{"dataType":"array","array":{"dataType":"refAlias","ref":"TransactionDetailInput"},"required":true},"cashAmount":{"dataType":"double"},"paymentMethod":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RefundTransactionBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true},"detailIds":{"dataType":"array","array":{"dataType":"refAlias","ref":"UUID"},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Purchase": {
        "dataType": "refObject",
        "properties": {
            "createdById": {"dataType":"string","required":true},
            "createdBy": {"ref":"User"},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedById": {"dataType":"string","required":true},
            "updatedBy": {"ref":"User"},
            "updatedAt": {"dataType":"datetime","required":true},
            "id": {"ref":"UUID","required":true},
            "vendorId": {"ref":"UUID","required":true},
            "vendor": {"ref":"Vendor"},
            "status": {"dataType":"string","required":true},
            "purchaseDate": {"dataType":"datetime","required":true},
            "purchaseDetails": {"dataType":"array","array":{"dataType":"refObject","ref":"PurchaseDetail"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PurchaseDetail": {
        "dataType": "refObject",
        "properties": {
            "id": {"ref":"UUID","required":true},
            "purchaseId": {"ref":"UUID","required":true},
            "purchase": {"ref":"Purchase"},
            "productId": {"ref":"UUID","required":true},
            "product": {"ref":"Product"},
            "qty": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PurchaseDetailInput": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"qty":{"dataType":"double","required":true},"productId":{"ref":"UUID","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreatePurchase": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"details":{"dataType":"array","array":{"dataType":"refAlias","ref":"PurchaseDetailInput"},"required":true},"purchaseDate":{"dataType":"datetime","required":true},"vendorId":{"ref":"UUID","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChangeStatusPurchase": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"string","required":true},"id":{"ref":"UUID","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePurchase": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"details":{"dataType":"array","array":{"dataType":"refAlias","ref":"PurchaseDetailInput"}},"purchaseDate":{"dataType":"datetime"},"vendorId":{"ref":"UUID"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Price": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"price":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"barcode":{"dataType":"string","required":true},"category":{"dataType":"string","required":true},"prices":{"dataType":"array","array":{"dataType":"refAlias","ref":"Price"},"required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"password":{"dataType":"string","required":true},"username":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsVendorController_getVendors: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.get('/vendors',
            ...(fetchMiddlewares<RequestHandler>(VendorController)),
            ...(fetchMiddlewares<RequestHandler>(VendorController.prototype.getVendors)),

            async function VendorController_getVendors(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVendorController_getVendors, request, response });

                const controller = new VendorController();

              await templateService.apiHandler({
                methodName: 'getVendors',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVendorController_searchVendors: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                page: {"in":"query","name":"page","dataType":"string"},
                name: {"in":"query","name":"name","dataType":"string"},
                phone: {"in":"query","name":"phone","dataType":"string"},
        };
        app.get('/vendors/search',
            ...(fetchMiddlewares<RequestHandler>(VendorController)),
            ...(fetchMiddlewares<RequestHandler>(VendorController.prototype.searchVendors)),

            async function VendorController_searchVendors(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVendorController_searchVendors, request, response });

                const controller = new VendorController();

              await templateService.apiHandler({
                methodName: 'searchVendors',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVendorController_createVendor: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"VendorBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.post('/vendors',
            ...(fetchMiddlewares<RequestHandler>(VendorController)),
            ...(fetchMiddlewares<RequestHandler>(VendorController.prototype.createVendor)),

            async function VendorController_createVendor(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVendorController_createVendor, request, response });

                const controller = new VendorController();

              await templateService.apiHandler({
                methodName: 'createVendor',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVendorController_updateVendor: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"ref":"UUID"},
                body: {"in":"body","name":"body","required":true,"ref":"VendorBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.put('/vendors/:id',
            ...(fetchMiddlewares<RequestHandler>(VendorController)),
            ...(fetchMiddlewares<RequestHandler>(VendorController.prototype.updateVendor)),

            async function VendorController_updateVendor(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVendorController_updateVendor, request, response });

                const controller = new VendorController();

              await templateService.apiHandler({
                methodName: 'updateVendor',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTransactionController_createTransaction: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateTransactionBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.post('/transactions',
            ...(fetchMiddlewares<RequestHandler>(TransactionController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionController.prototype.createTransaction)),

            async function TransactionController_createTransaction(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTransactionController_createTransaction, request, response });

                const controller = new TransactionController();

              await templateService.apiHandler({
                methodName: 'createTransaction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTransactionController_searchTransactions: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                page: {"in":"query","name":"page","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"string"},
                transactionNo: {"in":"query","name":"transactionNo","dataType":"string"},
                date: {"in":"query","name":"date","dataType":"string"},
                barcode: {"in":"query","name":"barcode","dataType":"string"},
        };
        app.get('/transactions',
            ...(fetchMiddlewares<RequestHandler>(TransactionController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionController.prototype.searchTransactions)),

            async function TransactionController_searchTransactions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTransactionController_searchTransactions, request, response });

                const controller = new TransactionController();

              await templateService.apiHandler({
                methodName: 'searchTransactions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTransactionController_getTransactionById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"ref":"UUID"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.get('/transactions/:id',
            ...(fetchMiddlewares<RequestHandler>(TransactionController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionController.prototype.getTransactionById)),

            async function TransactionController_getTransactionById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTransactionController_getTransactionById, request, response });

                const controller = new TransactionController();

              await templateService.apiHandler({
                methodName: 'getTransactionById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTransactionController_voidTransaction: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"ref":"UUID"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.put('/transactions/:id/void',
            ...(fetchMiddlewares<RequestHandler>(TransactionController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionController.prototype.voidTransaction)),

            async function TransactionController_voidTransaction(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTransactionController_voidTransaction, request, response });

                const controller = new TransactionController();

              await templateService.apiHandler({
                methodName: 'voidTransaction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTransactionController_refundTransaction: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"ref":"UUID"},
                body: {"in":"body","name":"body","required":true,"ref":"RefundTransactionBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.put('/transactions/:id/refund',
            ...(fetchMiddlewares<RequestHandler>(TransactionController)),
            ...(fetchMiddlewares<RequestHandler>(TransactionController.prototype.refundTransaction)),

            async function TransactionController_refundTransaction(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTransactionController_refundTransaction, request, response });

                const controller = new TransactionController();

              await templateService.apiHandler({
                methodName: 'refundTransaction',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseController_createPurchase: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreatePurchase"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.post('/purchases',
            ...(fetchMiddlewares<RequestHandler>(PurchaseController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseController.prototype.createPurchase)),

            async function PurchaseController_createPurchase(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseController_createPurchase, request, response });

                const controller = new PurchaseController();

              await templateService.apiHandler({
                methodName: 'createPurchase',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseController_searchPurchase: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                page: {"in":"query","name":"page","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"string"},
                vendorId: {"in":"query","name":"vendorId","ref":"UUID"},
                productId: {"in":"query","name":"productId","ref":"UUID"},
                purchaseDate: {"in":"query","name":"purchaseDate","dataType":"string"},
        };
        app.get('/purchases',
            ...(fetchMiddlewares<RequestHandler>(PurchaseController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseController.prototype.searchPurchase)),

            async function PurchaseController_searchPurchase(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseController_searchPurchase, request, response });

                const controller = new PurchaseController();

              await templateService.apiHandler({
                methodName: 'searchPurchase',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseController_getPurchaseById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"ref":"UUID"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.get('/purchases/:id',
            ...(fetchMiddlewares<RequestHandler>(PurchaseController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseController.prototype.getPurchaseById)),

            async function PurchaseController_getPurchaseById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseController_getPurchaseById, request, response });

                const controller = new PurchaseController();

              await templateService.apiHandler({
                methodName: 'getPurchaseById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseController_updateStatus: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"ChangeStatusPurchase"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.put('/purchases/change-status',
            ...(fetchMiddlewares<RequestHandler>(PurchaseController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseController.prototype.updateStatus)),

            async function PurchaseController_updateStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseController_updateStatus, request, response });

                const controller = new PurchaseController();

              await templateService.apiHandler({
                methodName: 'updateStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseController_updatePurchase: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"ref":"UUID"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdatePurchase"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.put('/purchases/:id',
            ...(fetchMiddlewares<RequestHandler>(PurchaseController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseController.prototype.updatePurchase)),

            async function PurchaseController_updatePurchase(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseController_updatePurchase, request, response });

                const controller = new PurchaseController();

              await templateService.apiHandler({
                methodName: 'updatePurchase',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_getProducts: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.get('/products',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.getProducts)),

            async function ProductController_getProducts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_getProducts, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'getProducts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_createProduct: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"ProductBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.post('/products',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.createProduct)),

            async function ProductController_createProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_createProduct, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'createProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_updateProduct: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"ref":"UUID"},
                body: {"in":"body","name":"body","required":true,"ref":"ProductBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.put('/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.updateProduct)),

            async function ProductController_updateProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_updateProduct, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'updateProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductController_searchProducts: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                page: {"in":"query","name":"page","required":true,"dataType":"string"},
                barcode: {"in":"query","name":"barcode","dataType":"string"},
                code: {"in":"query","name":"code","dataType":"string"},
                name: {"in":"query","name":"name","dataType":"string"},
        };
        app.get('/products/search',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.searchProducts)),

            async function ProductController_searchProducts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_searchProducts, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'searchProducts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LoginBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.post('/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_verifyAdmin: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LoginBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                defaultErrorResponse: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.post('/auth/verify-admin',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyAdmin)),

            async function AuthController_verifyAdmin(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyAdmin, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'verifyAdmin',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
