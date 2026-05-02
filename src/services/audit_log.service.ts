import dataSource from "@config/database";
import { AuditLog } from "@models/audit_log.model";
import { User } from "@models/user.model";
import bcrypt from "bcrypt";
import { ADMIN, VERIF_ADMIN } from "@constants/user";
import { UUID } from "types/common_type";
import { CreateAuditLogBody } from "types/audit_log";
import { EntityManager } from "typeorm";

export class AuditLogService {
  private repo = dataSource.getRepository(AuditLog);
  private userRepo = dataSource.getRepository(User);

  public async createLog(
    actor: User,
    body: CreateAuditLogBody,
  ): Promise<AuditLog> {
    let verifiedById: UUID | null = null;
    if (body.verifierUsername && body.verifierPassword) {
      const verifier = await this.userRepo.findOne({
        where: { username: body.verifierUsername },
      });
      if (!verifier) throw new Error("Verifier tidak ditemukan");
      if (verifier.role !== ADMIN && verifier.role !== VERIF_ADMIN)
        throw new Error("Verifier bukan admin");
      const ok = await bcrypt.compare(body.verifierPassword, verifier.password);
      if (!ok) throw new Error("Password verifier salah");
      verifiedById = verifier.id;
    }

    const log = new AuditLog();
    log.action = body.action;
    log.actorId = actor.id;
    log.verifiedById = verifiedById;
    log.entityType = body.entityType ?? null;
    log.entityId = body.entityId ?? null;
    log.reason = body.reason ?? null;
    log.payload = body.payload ?? null;
    return await this.repo.save(log);
  }

  public async createLogWithManager(
    manager: EntityManager,
    actor: User,
    data: Omit<CreateAuditLogBody, "verifierUsername" | "verifierPassword"> & {
      verifiedById?: UUID | null;
    },
  ): Promise<AuditLog> {
    const log = new AuditLog();
    log.action = data.action;
    log.actorId = actor.id;
    log.verifiedById = data.verifiedById ?? null;
    log.entityType = data.entityType ?? null;
    log.entityId = data.entityId ?? null;
    log.reason = data.reason ?? null;
    log.payload = data.payload ?? null;
    return await manager.save(log);
  }

  public async listLogs({
    page,
    action,
  }: {
    page: number;
    action?: string;
  }): Promise<{ logs: AuditLog[]; totalPages: number }> {
    const limit = 20;
    const skip = (page - 1) * limit;
    const qb = this.repo
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.actor", "actor")
      .leftJoinAndSelect("log.verifiedBy", "verifier")
      .orderBy("log.createdAt", "DESC")
      .skip(skip)
      .take(limit);
    if (action) qb.andWhere("log.action = :action", { action });
    const [logs, total] = await qb.getManyAndCount();
    return { logs, totalPages: Math.ceil(total / limit) };
  }
}
