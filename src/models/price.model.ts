import { UUID } from "types/common_type";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { DecimalTransformer } from "utils/decimal_transformer";
import { Product } from "./product.model";

@Entity()
@Unique(["productId", "name"])
export class PriceProduct {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  productId!: UUID;
  @JoinColumn({ name: "productId" })
  @ManyToOne(() => Product, (product) => product.prices)
  product?: Product;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  @Column({
    type: "decimal",
    nullable: false,
    transformer: new DecimalTransformer(),
  })
  price!: number;
}
