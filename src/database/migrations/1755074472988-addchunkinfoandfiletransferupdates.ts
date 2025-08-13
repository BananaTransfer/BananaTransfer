import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChunkInfoAndFileTransferUpdates1755074472988
  implements MigrationInterface
{
  name = 'AddChunkInfoAndFileTransferUpdates1755074472988';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chunk_info" ("id" SERIAL NOT NULL, "chunkNumber" integer NOT NULL, "chunkSize" integer NOT NULL, "etag" text NOT NULL, "s3Path" text NOT NULL, "isUploaded" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "fileTransferId" integer, CONSTRAINT "PK_438d132ca6f74b7d7cc5be3c572" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "private_key_kdf"`);
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD "totalChunks" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD "uploadedChunks" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD "chunkSize" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ADD "multipartUploadId" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password_created_at" TIMESTAMP DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "private_key_salt" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD "private_key_iv" text`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_transfer_status_enum" RENAME TO "file_transfer_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_transfer_status_enum" AS ENUM('CREATED', 'IN_PROGRESS', 'SENT', 'RETRIEVED', 'DELETED', 'EXPIRED', 'REFUSED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ALTER COLUMN "status" TYPE "public"."file_transfer_status_enum" USING "status"::"text"::"public"."file_transfer_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."file_transfer_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_login" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "chunk_info" ADD CONSTRAINT "FK_e3edbd9d4d7b893f867ca29f325" FOREIGN KEY ("fileTransferId") REFERENCES "file_transfer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chunk_info" DROP CONSTRAINT "FK_e3edbd9d4d7b893f867ca29f325"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "last_login" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_transfer_status_enum_old" AS ENUM('CREATED', 'SENT', 'RETRIEVED', 'DELETED', 'EXPIRED', 'REFUSED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" ALTER COLUMN "status" TYPE "public"."file_transfer_status_enum_old" USING "status"::"text"::"public"."file_transfer_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_transfer_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_transfer_status_enum_old" RENAME TO "file_transfer_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "private_key_iv"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "private_key_salt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "password_created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP COLUMN "multipartUploadId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP COLUMN "chunkSize"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP COLUMN "uploadedChunks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_transfer" DROP COLUMN "totalChunks"`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "private_key_kdf" text`);
    await queryRunner.query(`DROP TABLE "chunk_info"`);
  }
}
