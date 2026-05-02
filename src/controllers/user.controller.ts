import { handleControllerError, validateRequest } from "@errors/custom_error";
import { User } from "@models/user.model";
import { UserService } from "@services/user.service";
import { AuditLogService } from "@services/audit_log.service";
import { ADMIN, VERIF_ADMIN } from "@constants/user";
import { Request as ExRequest } from "express";
import { checkSchema } from "express-validator";
import {
  Body,
  Controller,
  Delete,
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
import {
  ApproveUserBody,
  approveUserSchema,
  CreateUserBody,
  createUserSchema,
  RegisterUserBody,
  registerUserSchema,
  UpdateUserBody,
  updateUserSchema,
} from "types/user";
import { UUID } from "types/common_type";
import { checkRole } from "utils/middleware";

@Route("users")
@Tags("User")
export class UserController extends Controller {
  private service = new UserService();
  private auditService = new AuditLogService();

  @Get()
  public async list(
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
    @Query() page = 1,
    @Query() status?: string,
    @Query() role?: string,
    @Query() search?: string,
  ): Promise<{ users: User[]; totalPages: number }> {
    try {
      await checkRole(req, ADMIN, VERIF_ADMIN);
      return await this.service.listUsers({
        page: Number(page) || 1,
        status,
        role,
        search,
      });
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Post()
  @Middlewares(checkSchema(createUserSchema))
  public async create(
    @Body() body: CreateUserBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<User> {
    try {
      validateRequest(req);
      await checkRole(req, ADMIN);
      return await this.service.createUser(body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Post("register")
  @Middlewares(checkSchema(registerUserSchema))
  public async register(
    @Body() body: RegisterUserBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<User> {
    try {
      validateRequest(req);
      return await this.service.registerUser(body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Put("{id}")
  @Middlewares(checkSchema(updateUserSchema))
  public async update(
    @Path() id: UUID,
    @Body() body: UpdateUserBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<User> {
    try {
      validateRequest(req);
      await checkRole(req, ADMIN);
      return await this.service.updateUser(id, body);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Post("{id}/approve")
  @Middlewares(checkSchema(approveUserSchema))
  public async approve(
    @Path() id: UUID,
    @Body() body: ApproveUserBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<User> {
    try {
      validateRequest(req);
      const { user: actor } = await checkRole(req, ADMIN, VERIF_ADMIN);
      const { user, verifierId } = await this.service.approveUser(id, body);
      await this.auditService.createLog(actor, {
        action: body.approve ? "USER_APPROVED" : "USER_REJECTED",
        entityType: "User",
        entityId: id,
        reason: body.approve ? "Approve user" : "Reject user",
        payload: { newRole: body.role, verifierId },
      });
      return user;
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }

  @Delete("{id}")
  public async remove(
    @Path() id: UUID,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<{ ok: boolean }> {
    try {
      await checkRole(req, ADMIN);
      return await this.service.deleteUser(id);
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
