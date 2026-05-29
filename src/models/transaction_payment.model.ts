import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UUID } from "types/common_type";
import { Transaction } from "./transaction.model";
import { DecimalTransformer } from "utils/decimal_transformer";

@Entity()
export class TransactionPayment {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  transactionId!: UUID;
  @JoinColumn({ name: "transactionId" })
  @ManyToOne(() => Transaction, (trx) => trx.payments, { onDelete: "CASCADE" })
  transaction?: Transaction;

  @Column({ type: "varchar", nullable: false })
  method!: string;

  @Column({
    type: "decimal",
    nullable: false,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  amount!: number;

  /**
   * Cash tendered for the cash portion of a payment (used to calculate change).
   * For non-cash methods this equals amount.
   */
  @Column({
    type: "decimal",
    nullable: false,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  tendered!: number;

  /**
   * Optional reference for non-cash payments (e.g. QRIS approval no., card no.).
   */
  @Column({ type: "varchar", nullable: true })
  reference?: string | null;
}
