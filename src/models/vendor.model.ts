import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseV2 } from "./basev2";
import { UUID } from "types/common_type";

@Entity()
export class Vendor extends BaseV2 {
    @PrimaryGeneratedColumn("uuid")
    id!: UUID

    @Column({type: "varchar", nullable: false})
    name!: string

    @Column({type: "varchar", nullable: false})
    phone!: string
}