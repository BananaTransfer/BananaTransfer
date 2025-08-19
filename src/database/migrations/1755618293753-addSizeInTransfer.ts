import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSizeInTransfer1755618293753 implements MigrationInterface {
    name = 'AddSizeInTransfer1755618293753'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_transfer" ADD "size" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."transfer_log_info_enum" RENAME TO "transfer_log_info_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transfer_log_info_enum" AS ENUM('TRANSFER_CREATED', 'TRANSFER_UPLOADED', 'TRANSFER_SENT_FAILED', 'TRANSFER_SENT', 'TRANSFER_ACCEPTED', 'TRANSFER_ACCEPTED_FAILED', 'TRANSFER_RETRIEVED_FAILED', 'TRANSFER_RETRIEVED', 'TRANSFER_DELETED', 'TRANSFER_EXPIRED', 'TRANSFER_REFUSED')`);
        await queryRunner.query(`ALTER TABLE "transfer_log" ALTER COLUMN "info" TYPE "public"."transfer_log_info_enum" USING "info"::"text"::"public"."transfer_log_info_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transfer_log_info_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."file_transfer_status_enum" RENAME TO "file_transfer_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."file_transfer_status_enum" AS ENUM('CREATED', 'UPLOADED', 'SENT', 'ACCEPTED', 'RETRIEVED', 'DELETED', 'EXPIRED', 'REFUSED')`);
        await queryRunner.query(`ALTER TABLE "file_transfer" ALTER COLUMN "status" TYPE "public"."file_transfer_status_enum" USING "status"::"text"::"public"."file_transfer_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."file_transfer_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."file_transfer_status_enum_old" AS ENUM('CREATED', 'UPLOADED', 'SENT', 'RETRIEVED', 'DELETED', 'EXPIRED', 'REFUSED')`);
        await queryRunner.query(`ALTER TABLE "file_transfer" ALTER COLUMN "status" TYPE "public"."file_transfer_status_enum_old" USING "status"::"text"::"public"."file_transfer_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."file_transfer_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."file_transfer_status_enum_old" RENAME TO "file_transfer_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."transfer_log_info_enum_old" AS ENUM('TRANSFER_CREATED', 'TRANSFER_UPLOADED', 'TRANSFER_SENT_FAILED', 'TRANSFER_SENT', 'TRANSFER_RETRIEVED_FAILED', 'TRANSFER_RETRIEVED', 'TRANSFER_DELETED', 'TRANSFER_EXPIRED', 'TRANSFER_REFUSED')`);
        await queryRunner.query(`ALTER TABLE "transfer_log" ALTER COLUMN "info" TYPE "public"."transfer_log_info_enum_old" USING "info"::"text"::"public"."transfer_log_info_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transfer_log_info_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transfer_log_info_enum_old" RENAME TO "transfer_log_info_enum"`);
        await queryRunner.query(`ALTER TABLE "file_transfer" DROP COLUMN "size"`);
    }

}
