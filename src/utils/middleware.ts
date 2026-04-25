import { Request } from "express";
import { verifyJWT } from "./jwt";
import { UnauthorizedError } from "@errors/custom_error";
import { JwtTokenPayload } from "types/auth";
import dataSource from "@config/database";
import { User } from "@models/user.model";

export async function checkRole(
  req: Request,
  ...allowedRoles: string[]
): Promise<{ payload: JwtTokenPayload; user: User }> {
  const token = req.cookies.access_token;
  if (!token) throw new UnauthorizedError("Token tidak ditemukan");
  const payload = await verifyJWT(token);
  if (!allowedRoles.includes(payload.role))
    throw new UnauthorizedError("Anda tidak memiliki akses ke resource ini");
  const userRepository = dataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: payload.user_id } });
  if (!user) throw new UnauthorizedError("User tidak ditemukan");
  if (!allowedRoles.includes(user.role))
    throw new UnauthorizedError("Anda tidak memiliki akses ke resource ini");
  return { payload, user };
}
