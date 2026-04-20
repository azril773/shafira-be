import { UnauthorizedError } from "@errors/custom_error";
import { JwtTokenPayload } from "types/auth";
import jwt from "jsonwebtoken";

export async function verifyJWT(token: string): Promise<JwtTokenPayload> {
    const secretKey = process.env.JWT_SECRET_KEY || "your_jwt_secret_key_here";
    return new Promise((resolve, reject) => {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          reject(new UnauthorizedError("Invalid token"));
        } else {
          resolve(decoded as JwtTokenPayload);
        }
      });
    });
  }