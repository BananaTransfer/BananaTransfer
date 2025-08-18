import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTransferPrimaryKey1755447585126
  implements MigrationInterface
{
  name = 'ChangeTransferPrimaryKey1755447585126';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP COLUMN "s3_path"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfer_log" DROP CONSTRAINT "FK_a989525e70c6520aaa0e49615f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfer_log" DROP COLUMN "fileTransferId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfer_log" ADD "fileTransferId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP CONSTRAINT "PK_20d704885e78f333c29c18b18ae"`,
    );
    await queryRunner.query(`ALTER TABLE "file_transfer" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD CONSTRAINT "PK_20d704885e78f333c29c18b18ae" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfer_log" ADD CONSTRAINT "FK_a989525e70c6520aaa0e49615f8" FOREIGN KEY ("fileTransferId") REFERENCES "file_transfer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transfer_log" DROP CONSTRAINT "FK_a989525e70c6520aaa0e49615f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP CONSTRAINT "PK_20d704885e78f333c29c18b18ae"`,
    );
    await queryRunner.query(`ALTER TABLE "file_transfer" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD CONSTRAINT "PK_20d704885e78f333c29c18b18ae" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfer_log" DROP COLUMN "fileTransferId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfer_log" ADD "fileTransferId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfer_log" ADD CONSTRAINT "FK_a989525e70c6520aaa0e49615f8" FOREIGN KEY ("fileTransferId") REFERENCES "file_transfer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "file_transfer" ADD "s3_path" text`);
  }
}
