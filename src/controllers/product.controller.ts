import { handleControllerError } from "@errors/custom_error";
import { Product } from "@models/product.model";
import { ProductService } from "@services/product.service";
import { ProductBody, productSchema, UpdateStockBody, updateStockSchema } from "types/product";
import { Request as ExRequest } from "express";
import { checkSchema, param, query, validationResult } from "express-validator";
import {
  Body,
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Query,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from "tsoa";
import { checkRole } from "utils/middleware";
import { ADMIN, CASHIER, INVENTORY_MANAGER } from "@constants/user";
import { UUID } from "types/common_type";

@Route("products")
@Tags("Products")
export class ProductController extends Controller {
  private productService = new ProductService();



  @Get("")
  public async getProducts(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Product[]> {
    try {
      await checkRole(req, ADMIN);
      return await this.productService.getProducts();
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
  @Post("")
  @Middlewares([checkSchema(productSchema)])
  public async createProduct(
    @Body() body: ProductBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Product> {
    try {
      validationResult(req);
      await checkRole(req, ADMIN);
      return await this.productService.createProduct(body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}/stock")
  @Middlewares([param("id").trim().escape().isUUID(), checkSchema(updateStockSchema)])
  public async updateStock(
    @Path() id: UUID,
    @Body() body: UpdateStockBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Product> {
    try {
      validationResult(req);
      const { user } = await checkRole(req, ADMIN, INVENTORY_MANAGER);
      return await this.productService.updateStock(id, body.stock, user, body.reason);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}")
  @Middlewares([param("id").trim().escape().isUUID(), checkSchema(productSchema)])
  public async updateProduct(
    @Path() id: UUID,
    @Body() body: ProductBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Product> {
    try {
      validationResult(req);
      await checkRole(req, ADMIN);
      return await this.productService.updateProduct(id, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("search-pos")
  @Middlewares([
    query("name").trim().escape().isString().optional({ values: 'undefined' }),
  ])
  public async searchProductsForPOS(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() name?: string,
  ): Promise<Product[]> {
    try {
      validationResult(req);
      await checkRole(req, ADMIN, CASHIER);
      return await this.productService.searchProductsForPOS({ name });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("search-purchase")
  @Middlewares([
    query("q").trim().escape().isString().optional({ values: 'undefined' }),
  ])
  public async searchProductsForPurchase(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() q?: string,
  ): Promise<Product[]> {
    try {
      validationResult(req);
      await checkRole(req, ADMIN, INVENTORY_MANAGER);
      return await this.productService.searchProductsForPurchase({ q });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("search")
  @Middlewares([
    query("page").trim().escape().isString(),
    query("barcode").trim().escape().isString().optional({values: 'undefined'}),
    query("code").trim().escape().isString().optional({values: 'undefined'}),
    query("name").trim().escape().isString().optional({values: 'undefined'}),
  ])
  public async searchProducts(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() page: string,
    @Query() barcode?: string,
    @Query() code?: string,
    @Query() name?: string,
  ): Promise<{ products: Product[]; totalPages: number }> {
    try {
      validationResult(req);
      await checkRole(req, ADMIN, CASHIER);
      return await this.productService.searchProducts({
        page: page ? parseInt(page) : 1,
        barcode,
        code,
        name,
      });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
