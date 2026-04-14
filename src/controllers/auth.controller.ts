import { handleControllerError, validateRequest } from "@errors/custom_error";
import { AuthService } from "@services/auth.service";
import { LoginBody } from "types/auth";
import { Request as ExRequest } from "express";
import { body } from "express-validator";
import {
  Body,
  Controller,
  Middlewares,
  Post,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from "tsoa";

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  private authService: AuthService = new AuthService();

  @Post("login")
  @Middlewares(
    body("username").trim().escape().isString(),
    body("password").trim().escape().isString(),
  )
  public async login(
    @Body() body: LoginBody,
    @Request() req: ExRequest,
    @Res() defaultErrorResponse: TsoaResponse<500, { message: string }>,
  ): Promise<{ access_token: string }> {
    try {
      validateRequest(req);
      const { access_token } = await this.authService.login(
        body.username,
        body.password,
      );
      console.log("OKOKOK")
      req.res?.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
      });

      return { access_token: access_token };
    } catch (error) {
      // @ts-expect-error TsoaResponse any return type
      return handleControllerError(error, { defaultErrorResponse });
    }
  }
}
