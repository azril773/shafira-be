import { handleControllerError } from "@errors/custom_error";
import { Product } from "@models/product.model";
import { ProductService } from "@services/product.service";
import { ProductBody, productSchema } from "types/product";
import { Request as ExRequest } from "express";
import { checkSchema, param, validationResult } from "express-validator";
import {
  Body,
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from "tsoa";

@Route("products")
@Tags("Products")
export class ProductController extends Controller {
  private productService = new ProductService();

  @Post("")
  @Middlewares(checkSchema(productSchema))
  public async createProduct(
    @Body() body: ProductBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Product> {
    try {
      validationResult(req);
      return await this.productService.createProduct(body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("barcode/{barcode}")
  @Middlewares([param("barcode").trim().escape().isString().notEmpty()])
  public async getProductByBarcode(
    @Path() barcode: string,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Product[]> {
    try {
      validationResult(req);
      return await this.productService.getProductByBarcode(barcode);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("code/{code}")
  @Middlewares([param("code").trim().escape().isString().notEmpty()])
  public async getProductByCode(
    @Path() code: string,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Product[]> {
    try {
      validationResult(req);
      return await this.productService.getProductByCode(code);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
