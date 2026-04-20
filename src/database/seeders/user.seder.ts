import { CASHIER } from "@constants/user";
import { User } from "@models/user.model";
import { DataSource } from "typeorm";

export async function userSeeder(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const user = new User();
  user.username = "admin";
  user.password = "$2a$10$6mcZQFuTYBxhXKOaVOHtdeN/hb1YbfLNcct5H9FqRNfivCFr/kGrS"; // hashed password for "admin123"
  user.role = "admin";
  const cashier = new User();
  cashier.username = "cashier";
  cashier.password = "$2a$10$6mcZQFuTYBxhXKOaVOHtdeN/hb1YbfLNcct5H9FqRNfivCFr/kGrS"; // hashed password for "cashier123"
  cashier.role = CASHIER;
  return await userRepository.save([user, cashier]);
}
