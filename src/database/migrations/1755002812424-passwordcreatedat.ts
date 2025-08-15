import { MigrationInterface, QueryRunner } from 'typeorm';

export class Passwordcreatedat1755002812424 implements MigrationInterface {
  name = 'Passwordcreatedat1755002812424';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password_created_at" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_login" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_login" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "password_created_at"`,
    );
  }
}
