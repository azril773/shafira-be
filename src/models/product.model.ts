import { UUID } from "types/common_type";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { DecimalTransformer } from "utils/decimal_transformer";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: false, unique: true })
  code!: string;

  @Column({ type: "varchar", nullable: false })
  category!: string;

  @Column({ type: "varchar", length: 150, nullable: false })
  barcode!: string;

  @Column({
    type: "decimal",
    nullable: false,
    transformer: new DecimalTransformer(),
  })
  price!: number;

  @Column({ type: "integer", nullable: false, default: 0 })
  stock!: number;
}
