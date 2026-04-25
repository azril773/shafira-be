import { Vendor } from "@models/vendor.model";
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
import { Request as ExRequest } from "express";
import { AuthService } from "@services/auth.service";
import {
  handleControllerError,
  UnauthorizedError,
  validateRequest,
} from "@errors/custom_error";
import { VendorService } from "@services/vendor.service";
import {
  VendorBody,
  vendorSchema,
} from "types/vendor_type";
import { checkSchema, param, query } from "express-validator";
import { UUID } from "types/common_type";

@Route("vendors")
@Tags("Vendors")
export class VendorController extends Controller {
  private authService = new AuthService();
  private vendorService = new VendorService();

  @Get("")
  public async getVendors(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<Vendor[]> {
    try {
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.vendorService.getVendors();
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Get("search")
  @Middlewares([
    query("page")
      .trim()
      .escape()
      .isInt({ min: 1 })
      .optional({ values: "undefined" }),
    query("name").trim().escape().optional({ values: "undefined" }),
    query("phone").trim().escape().optional({ values: "undefined" }),
  ])
  public async searchVendors(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() page?: string,
    @Query() name?: string,
    @Query() phone?: string,
  ): Promise<{ vendors: Vendor[]; totalPages: number }> {
    try {
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.vendorService.searchVendors({
        page: page ? parseInt(page, 10) : 1,
        name,
        phone,
      });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Post("")
  @Middlewares([checkSchema(vendorSchema)])
  public async createVendor(
    @Body() body: VendorBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ) {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.vendorService.createVendor(user, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}")
  @Middlewares([
    param("id").trim().escape().isUUID(),
    checkSchema(vendorSchema),
  ])
  public async updateVendor(
    @Path() id: UUID,
    @Body() body: VendorBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ) {
    try {
      validateRequest(req);
      const token = req.cookies.access_token;
      const user = await this.authService.getUserByToken(token as string);
      if (!user) throw new UnauthorizedError("user tidak ada");
      return await this.vendorService.updateVendor(id, user, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
