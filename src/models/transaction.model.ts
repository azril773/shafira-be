import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UUID } from "types/common_type";
import { User } from "./user.model";
import { Base } from "./base";
import { TransactionDetail } from "./transaction_detail.model";
import { DecimalTransformer } from "utils/decimal_transformer";

@Entity()
export class Transaction extends Base {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  cashierId!: UUID;
  @JoinColumn({ name: "cashierId" })
  @ManyToOne(() => User)
  cashier?: User;

  @OneToMany(
    () => TransactionDetail,
    (transactionDetail) => transactionDetail.transaction,
    { cascade: true },
  )
  transactionDetails?: TransactionDetail[];

  @Column({ type: "varchar", nullable: false })
  transactionNo!: string;

  @Column({
    type: "decimal",
    nullable: false,
    transformer: new DecimalTransformer(),
  })
  totalPrice!: number;

  @Column({ type: "integer", nullable: false })
  totalQty!: number;

  @Column({ type: "varchar", nullable: false, default: "POSTED" })
  status!: string;

  @Column({ type: "varchar", nullable: false, default: "Tunai" })
  paymentMethod!: string;

  @Column({
    type: "decimal",
    nullable: false,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  cashAmount!: number;

  @Column({
    type: "decimal",
    nullable: false,
    default: 0,
    transformer: new DecimalTransformer(),
  })
  changeAmount!: number;
}
