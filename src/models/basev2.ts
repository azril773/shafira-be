import {
    Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.model";

export class BaseV2 {
  @Column({ type: "uuid", nullable: false })
  createdById!: string;
  @JoinColumn({ name: "createdById" })
  @ManyToOne(() => User, { nullable: false })
  createdBy?: User;
  
  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
  
  @Column({ type: "uuid", nullable: false })
  updatedById!: string;
  @JoinColumn({ name: "updatedById" })
  @ManyToOne(() => User, { nullable: false })
  updatedBy?: User;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
