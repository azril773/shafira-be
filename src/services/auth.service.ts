import dataSource from "@config/database";
import { User } from "@models/user.model";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { verifyJWT } from "utils/jwt";

export class AuthService {
  private userRepository = dataSource.getRepository(User);

  public async login(
    username: string,
    password: string,
  ): Promise<{ user: User; access_token: string }> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid password");

    const secretKey = process.env.JWT_SECRET_KEY || "your_jwt_secret_key_here";
    const accessToken = jwt.sign(
      { role: user.role, user_id: user.id },
      secretKey,
      {
        expiresIn: "1d",
        algorithm: "HS256",
        issuer: "backend-pos",
        jwtid: randomUUID(),
      },
    );

    // Add password validation logic here
    return { user, access_token: accessToken };
  }

  public async getUserByToken(token: string): Promise<User | null> {
    const decoded = await verifyJWT(token);
    const user = await this.userRepository.findOne({
      where: { id: decoded.user_id },
    });
    return user;
  }

}
