import { UUID } from "types/common_type";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PriceProduct } from "./price.model";

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

  @OneToMany(() => PriceProduct, (price) => price.product, { cascade: true })
  prices!: PriceProduct[];

  @Column({ type: "integer", nullable: false, default: 0 })
  stock!: number;
}
