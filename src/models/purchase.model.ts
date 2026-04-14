import { UUID } from "types/common_type";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product.model";
import { Vendor } from "./vendor.model";
import { BaseV2 } from "./basev2";

@Entity()
export class Purchase extends BaseV2 {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  productId!: UUID;
  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: "productId" })
  product?: Product;

  @Column({ type: "uuid", nullable: false })
  vendorId!: UUID;
  @ManyToOne(() => Vendor, { nullable: false })
  @JoinColumn({ name: "vendorId" })
  vendor?: Vendor;

  @Column({ type: "varchar", nullable: false })
  status!: string

  @Column({type: 'timestamptz', nullable: false})
  purchaseDate!: Date

  @Column({ type: "integer", nullable: false })
  qty!: number;
}
