import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UUID } from "types/common_type";
import { Product } from "./product.model";
import { Purchase } from "./purchase.model";

@Entity()
export class PurchaseDetail {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  purchaseId!: UUID;
  @ManyToOne(() => Purchase, (purchase) => purchase.purchaseDetails, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "purchaseId" })
  purchase?: Purchase;

  @Column({ type: "uuid", nullable: false })
  productId!: UUID;
  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: "productId" })
  product?: Product;

  @Column({ type: "integer", nullable: false })
  qty!: number;
}
