import { handleControllerError } from "@errors/custom_error";
import { Product } from "@models/product.model";
import { ProductService } from "@services/product.service";
import { ProductBody, productSchema } from "types/product";
import { Request as ExRequest } from "express";
import { checkSchema, param, query, validationResult } from "express-validator";
import {
  Body,
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from "tsoa";
import { checkRole } from "utils/middleware";
import { ADMIN, CASHIER } from "@constants/user";

@Route("products")
@Tags("Products")
export class ProductController extends Controller {
  private productService = new ProductService();

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

  @Get("search")
  @Middlewares([
    query("page").trim().escape().isString(),
    query("barcode").trim().escape().isString().optional({values: 'undefined'}),
    query("code").trim().escape().isString().optional({values: 'undefined'}),
  ])
  public async searchProducts(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() page: string,
    @Query() barcode?: string,
    @Query() code?: string,
  ): Promise<{ products: Product[]; totalPages: number }> {
    try {
      validationResult(req);
      await checkRole(req, ADMIN, CASHIER);
      return await this.productService.searchProducts({
        page: page ? parseInt(page) : 1,
        barcode,
        code,
      });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
