import { UUID } from "types/common_type";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vendor } from "./vendor.model";
import { BaseV2 } from "./basev2";
import { PurchaseDetail } from "./purchase_detail.model";

@Entity()
export class Purchase extends BaseV2 {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "uuid", nullable: false })
  vendorId!: UUID;
  @ManyToOne(() => Vendor, { nullable: false })
  @JoinColumn({ name: "vendorId" })
  vendor?: Vendor;

  @Column({ type: "varchar", nullable: false })
  status!: string;

  @Column({ type: "timestamptz", nullable: false })
  purchaseDate!: Date;

  @OneToMany(
    () => PurchaseDetail,
    (purchaseDetail) => purchaseDetail.purchase,
    { cascade: true },
  )
  purchaseDetails?: PurchaseDetail[];
}
