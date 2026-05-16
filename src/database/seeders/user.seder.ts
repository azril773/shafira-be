import { ADMIN, CASHIER, USER_STATUS_APPROVED, VERIF_ADMIN } from "@constants/user";
import { User } from "@models/user.model";
import { DataSource } from "typeorm";

const HASH = "$2a$10$6mcZQFuTYBxhXKOaVOHtdeN/hb1YbfLNcct5H9FqRNfivCFr/kGrS";

export async function userSeeder(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const admin = new User();
  admin.username = "admin";
  admin.password = HASH; // "admin123"
  admin.role = ADMIN;
  admin.name = "Admin";
  admin.status = USER_STATUS_APPROVED;

  const cashier = new User();
  cashier.username = "cashier";
  cashier.password = HASH; // "cashier123"
  cashier.role = CASHIER;
  cashier.name = "Kasir";
  cashier.status = USER_STATUS_APPROVED;

  const verifAdmin = new User();
  verifAdmin.username = "verif_admin";
  verifAdmin.password = HASH; // "admin123" / "cashier123" – same hash
  verifAdmin.role = VERIF_ADMIN;
  verifAdmin.name = "Verifikator Admin";
  verifAdmin.status = USER_STATUS_APPROVED;

  return await userRepository.save([admin, cashier, verifAdmin]);
}
