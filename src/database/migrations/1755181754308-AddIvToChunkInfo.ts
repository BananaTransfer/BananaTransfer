import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIvToChunkInfo1755181754308 implements MigrationInterface {
    name = 'AddIvToChunkInfo1755181754308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chunk_info" ADD "iv" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chunk_info" DROP COLUMN "iv"`);
    }

}
