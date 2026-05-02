import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { type UUID } from "types/common_type";
import { Product } from "./product.model";
import { Transaction } from "./transaction.model";
import { DecimalTransformer } from "utils/decimal_transformer";
import { Uom } from "./uom.model";

@Entity()
export class TransactionDetail {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  transactionId!: UUID;
  @JoinColumn({ name: "transactionId" })
  @ManyToOne(() => Transaction, (transaction) => transaction.transactionDetails)
  transaction?: Transaction;

  @Column({ type: "varchar", nullable: false })
  historicalName!: string;

  @Column({ type: "varchar", nullable: false })
  historicalBarcode!: string;

  @Column({ type: "varchar", nullable: false })
  historicalCode!: string;

  @Column({ type: "varchar", nullable: false })
  historicalPriceName!: string;

  @Column({
    type: "decimal",
    nullable: false,
    transformer: new DecimalTransformer(),
  })
  historicalPrice!: number;

  @Column({ type: "varchar", nullable: false })
  historicalCategory!: string;
  

  @Column({ type: "uuid", nullable: false })
  productId!: UUID;
  @JoinColumn({ name: "productId" })
  @ManyToOne(() => Product)
  product?: Product;

  @Column({ type: "uuid", nullable: true })
  uomId?: UUID | null;
  @JoinColumn({ name: "uomId" })
  @ManyToOne(() => Uom, { nullable: true })
  uom?: Uom | null;

  @Column({ type: "varchar", nullable: true })
  historicalUomCode?: string | null;

  @Column({ type: "varchar", nullable: true })
  historicalUomName?: string | null;

  @Column({ type: "boolean", nullable: false, default: false })
  isRefund!: boolean;

  @Column({ type: "varchar", nullable: true })
  refundReason?: string | null;

  @Column({ type: "integer", nullable: false })
  qty!: number;
}
