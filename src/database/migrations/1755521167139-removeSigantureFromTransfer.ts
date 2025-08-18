import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSigantureFromTransfer1755521167139
  implements MigrationInterface
{
  name = 'RemoveSigantureFromTransfer1755521167139';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP COLUMN "signature_sender"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD "signature_sender" text NOT NULL`,
    );
  }
}
