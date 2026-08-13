import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UUID } from "types/common_type";
import { SuspendedCartItem } from "types/suspended_cart";
import { User } from "./user.model";

@Entity()
export class SuspendedCart {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  cashierId!: UUID;
  @JoinColumn({ name: "cashierId" })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  cashier?: User;

  @Column({ type: "varchar", length: 255, nullable: false })
  label!: string;

  @Column({ type: "jsonb", nullable: false })
  items!: SuspendedCartItem[];

  @CreateDateColumn({ type: "timestamptz" })
  savedAt!: Date;
}
