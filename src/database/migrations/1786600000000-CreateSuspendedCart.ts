import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSuspendedCart1786600000000 implements MigrationInterface {
  name = "CreateSuspendedCart1786600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suspended_cart" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cashierId" uuid NOT NULL,
        "label" varchar(255) NOT NULL,
        "items" jsonb NOT NULL,
        "savedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suspended_cart" PRIMARY KEY ("id"),
        CONSTRAINT "FK_suspended_cart_cashier" FOREIGN KEY ("cashierId")
          REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_suspended_cart_cashier_saved_at"
      ON "suspended_cart" ("cashierId", "savedAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "suspended_cart"');
  }
}
