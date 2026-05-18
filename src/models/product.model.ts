import { UUID } from "types/common_type";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { PriceProduct } from "./price.model";
import { Uom } from "./uom.model";
import { DecimalTransformer } from "utils/decimal_transformer";

@Entity()
@Unique(['code', 'barcode'])
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: UUID;

  @Column({ type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  code!: string;

  @Column({ type: "varchar", nullable: false, default: "Uncategorized" })
  category!: string;

  @Column({ type: "varchar", length: 150, nullable: false })
  barcode!: string;

  @OneToMany(() => PriceProduct, (price) => price.product, { cascade: true })
  prices!: PriceProduct[];

  @Column({ type: "decimal", nullable: false, default: 0, transformer: new DecimalTransformer() })
  stock!: number;

  @Column({ type: "uuid", nullable: true })
  uom_id?: UUID | null;
  @JoinColumn({ name: "uom_id" })
  @ManyToOne(() => Uom, { nullable: true })
  uom?: Uom | null;
}
