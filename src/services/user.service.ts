import dataSource from "@config/database";
import {
  ADMIN,
  USER_STATUS_APPROVED,
  USER_STATUS_PENDING,
  USER_STATUS_REJECTED,
  VERIF_ADMIN,
} from "@constants/user";
import { User } from "@models/user.model";
import bcrypt from "bcrypt";
import { UUID } from "types/common_type";
import {
  ApproveUserBody,
  CreateUserBody,
  RegisterUserBody,
  UpdateUserBody,
} from "types/user";

export class UserService {
  private repo = dataSource.getRepository(User);

  public async listUsers({
    page,
    status,
    role,
    search,
  }: {
    page: number;
    status?: string;
    role?: string;
    search?: string;
  }): Promise<{ users: User[]; totalPages: number }> {
    const limit = 10;
    const skip = (page - 1) * limit;
    const qb = this.repo
      .createQueryBuilder("u")
      .orderBy("u.username", "ASC")
      .skip(skip)
      .take(limit);
    if (status) qb.andWhere("u.status = :status", { status });
    if (role) qb.andWhere("u.role = :role", { role });
    if (search) qb.andWhere("u.username ILIKE :s", { s: `%${search}%` });
    const [users, total] = await qb.getManyAndCount();
    users.forEach((u) => {
      // @ts-expect-error – delete safe field
      delete u.password;
    });
    return { users, totalPages: Math.ceil(total / limit) };
  }

  public async createUser(body: CreateUserBody): Promise<User> {
    const exists = await this.repo.findOne({
      where: { username: body.username },
    });
    if (exists) throw new Error("Username sudah dipakai");
    const user = new User();
    user.username = body.username;
    user.name = body.name ?? null;
    user.role = body.role;
    user.password = await bcrypt.hash(body.password, 10);
    user.status = USER_STATUS_APPROVED;
    const saved = await this.repo.save(user);
    // @ts-expect-error – delete safe field
    delete saved.password;
    return saved;
  }

  public async registerUser(body: RegisterUserBody): Promise<User> {
    const exists = await this.repo.findOne({
      where: { username: body.username },
    });
    if (exists) throw new Error("Username sudah dipakai");
    const user = new User();
    user.username = body.username;
    user.name = body.name ?? null;
    user.role = body.role;
    user.password = await bcrypt.hash(body.password, 10);
    user.status = USER_STATUS_PENDING;
    const saved = await this.repo.save(user);
    // @ts-expect-error – delete safe field
    delete saved.password;
    return saved;
  }

  public async updateUser(id: UUID, body: UpdateUserBody): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new Error("User tidak ditemukan");
    if (body.name !== undefined) user.name = body.name;
    if (body.role !== undefined) user.role = body.role;
    if (body.status !== undefined) user.status = body.status;
    if (body.password) user.password = await bcrypt.hash(body.password, 10);
    const saved = await this.repo.save(user);
    // @ts-expect-error – delete safe field
    delete saved.password;
    return saved;
  }

  public async approveUser(
    id: UUID,
    body: ApproveUserBody,
  ): Promise<{ user: User; verifierId: UUID }> {
    const verifier = await this.repo.findOne({
      where: { username: body.verifierUsername },
    });
    if (!verifier) throw new Error("Verifier tidak ditemukan");
    if (verifier.role !== ADMIN && verifier.role !== VERIF_ADMIN)
      throw new Error("Verifier bukan admin");
    const ok = await bcrypt.compare(body.verifierPassword, verifier.password);
    if (!ok) throw new Error("Password verifier salah");

    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new Error("User tidak ditemukan");

    if (body.approve) {
      user.status = USER_STATUS_APPROVED;
      if (body.role) user.role = body.role;
    } else {
      user.status = USER_STATUS_REJECTED;
    }
    const saved = await this.repo.save(user);
    // @ts-expect-error – delete safe field
    delete saved.password;
    return { user: saved, verifierId: verifier.id };
  }

  public async deleteUser(id: UUID): Promise<{ ok: boolean }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new Error("User tidak ditemukan");
    await this.repo.remove(user);
    return { ok: true };
  }
}

void USER_STATUS_PENDING; void USER_STATUS_REJECTED;
