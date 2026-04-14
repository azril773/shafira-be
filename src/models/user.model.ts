import { UUID } from "types/common_type";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "varchar", unique: true, nullable: false })
  username!: string;

  @Column({ type: "varchar", nullable: false })
  password!: string;

  @Column({ type: "varchar", nullable: false })
  role!: string;
}
