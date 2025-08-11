import { MigrationInterface, QueryRunner } from "typeorm";

export class Key1754934306847 implements MigrationInterface {
    name = 'Key1754934306847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "private_key_kdf"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "private_key_salt" text`);
        await queryRunner.query(`ALTER TABLE "user" ADD "private_key_iv" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "private_key_iv"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "private_key_salt"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "private_key_kdf" text`);
    }

}
