import { User } from "@models/user.model";
import { DataSource } from "typeorm";

export async function userSeeder(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const user = new User();
  user.username = "admin";
  user.password = "$2a$10$c/Z4k72XlxPNqZY78f0r/OfZqbpaCQzmO54geOvEXv09ME5YSAKNy"; // hashed password for "admin123"
  user.role = "admin";
  return await userRepository.save(user);
}
