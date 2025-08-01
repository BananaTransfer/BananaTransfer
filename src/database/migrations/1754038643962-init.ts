import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1754038643962 implements MigrationInterface {
    name = 'Init1754038643962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transfer_log_info_enum" AS ENUM('TRANSFER_CREATED', 'TRANSFER_SENT_FAILED', 'TRANSFER_SENT', 'TRANSFER_RETRIEVED_FAILED', 'TRANSFER_RETRIEVED', 'TRANSFER_DELETED', 'TRANSFER_EXPIRED', 'TRANSFER_REFUSED')`);
        await queryRunner.query(`CREATE TABLE "transfer_log" ("id" SERIAL NOT NULL, "info" "public"."transfer_log_info_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "fileTransferId" integer, CONSTRAINT "PK_e6a71a5433f05e9b2c72def5a45" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."file_transfer_status_enum" AS ENUM('CREATED', 'SENT', 'RETRIEVED', 'DELETED', 'EXPIRED', 'REFUSED')`);
        await queryRunner.query(`CREATE TABLE "file_transfer" ("id" SERIAL NOT NULL, "symmetric_key_encrypted" text NOT NULL, "signature_sender" text NOT NULL, "status" "public"."file_transfer_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "filename" text NOT NULL, "subject" text NOT NULL, "s3_path" text, "senderId" integer, "receiverId" integer, CONSTRAINT "PK_20d704885e78f333c29c18b18ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'DISABLED', 'BLOCKED', 'DELETED')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."user_status_enum", "email" text, "last_login" TIMESTAMP, "password_hash" text, "private_key_encrypted" text, "private_key_kdf" text, "public_key" text, "key_created_at" TIMESTAMP, "domain" text, "type" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_31ef2b4d30675d0c15056b7f6e" ON "user" ("type") `);
        await queryRunner.query(`CREATE TABLE "trusted_recipient" ("id" SERIAL NOT NULL, "public_key_hash" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "localUserId" integer, "userId" integer, CONSTRAINT "PK_88a9be76db48969eb6af91766b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transfer_log" ADD CONSTRAINT "FK_0291a0080d6e8ee52c900890f27" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transfer_log" ADD CONSTRAINT "FK_a989525e70c6520aaa0e49615f8" FOREIGN KEY ("fileTransferId") REFERENCES "file_transfer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_transfer" ADD CONSTRAINT "FK_cce83dd5ef64aa240e694028acc" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_transfer" ADD CONSTRAINT "FK_d417532d3d6363c06577060c420" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trusted_recipient" ADD CONSTRAINT "FK_ea1e4bd3c469949d02aab53f636" FOREIGN KEY ("localUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trusted_recipient" ADD CONSTRAINT "FK_61823a5697f421759facf3b1c34" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trusted_recipient" DROP CONSTRAINT "FK_61823a5697f421759facf3b1c34"`);
        await queryRunner.query(`ALTER TABLE "trusted_recipient" DROP CONSTRAINT "FK_ea1e4bd3c469949d02aab53f636"`);
        await queryRunner.query(`ALTER TABLE "file_transfer" DROP CONSTRAINT "FK_d417532d3d6363c06577060c420"`);
        await queryRunner.query(`ALTER TABLE "file_transfer" DROP CONSTRAINT "FK_cce83dd5ef64aa240e694028acc"`);
        await queryRunner.query(`ALTER TABLE "transfer_log" DROP CONSTRAINT "FK_a989525e70c6520aaa0e49615f8"`);
        await queryRunner.query(`ALTER TABLE "transfer_log" DROP CONSTRAINT "FK_0291a0080d6e8ee52c900890f27"`);
        await queryRunner.query(`DROP TABLE "trusted_recipient"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_31ef2b4d30675d0c15056b7f6e"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
        await queryRunner.query(`DROP TABLE "file_transfer"`);
        await queryRunner.query(`DROP TYPE "public"."file_transfer_status_enum"`);
        await queryRunner.query(`DROP TABLE "transfer_log"`);
        await queryRunner.query(`DROP TYPE "public"."transfer_log_info_enum"`);
    }

}
