import dataSource from "@config/database";
import { User } from "@models/user.model";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

export class UserService {
  private userRepository = dataSource.getRepository(User);
  public async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string, refresh_token: string }> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid password");

    const secretKey = process.env.JWT_SECRET_KEY || "your_jwt_secret_key_here";
    const accessToken = jwt.sign({ role: user.role }, secretKey, {
      expiresIn: "15m",
      algorithm: "HS256",
      issuer: "backend-pos",
      jwtid: randomUUID()
    });

    const refreshToken = jwt.sign({ role: user.role }, secretKey, {
      expiresIn: "7d",
      algorithm: "HS256",
      issuer: "backend-pos",
      jwtid: randomUUID()
    });


    // Add password validation logic here
    return { access_token: accessToken, refresh_token: refreshToken};
  }
}
