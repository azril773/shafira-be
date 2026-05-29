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
@Unique(["product_id", "name"])
export class PriceProduct {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  product_id!: UUID;
  @JoinColumn({ name: "product_id" })
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

  @Column({
    type: "decimal",
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  promoPrice?: number | null;

  @Column({ type: "date", nullable: true })
  promoStartDate?: Date | null;

  @Column({ type: "date", nullable: true })
  promoEndDate?: Date | null;
}
