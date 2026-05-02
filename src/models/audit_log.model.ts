import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UUID } from "types/common_type";
import { User } from "./user.model";

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "varchar", nullable: false })
  action!: string;

  @Column({ type: "uuid", nullable: false })
  actorId!: UUID;
  @ManyToOne(() => User)
  @JoinColumn({ name: "actorId" })
  actor?: User;

  @Column({ type: "uuid", nullable: true })
  verifiedById?: UUID | null;
  @ManyToOne(() => User)
  @JoinColumn({ name: "verifiedById" })
  verifiedBy?: User | null;

  @Column({ type: "varchar", nullable: true })
  entityType?: string | null;

  @Column({ type: "uuid", nullable: true })
  entityId?: UUID | null;

  @Column({ type: "text", nullable: true })
  reason?: string | null;

  @Column({ type: "jsonb", nullable: true })
  payload?: unknown;

  @CreateDateColumn()
  createdAt!: Date;
}
