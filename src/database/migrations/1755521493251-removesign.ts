import { MigrationInterface, QueryRunner } from "typeorm";

export class Removesign1755521493251 implements MigrationInterface {
    name = 'Removesign1755521493251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_transfer" DROP COLUMN "signature_sender"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_transfer" ADD "signature_sender" text NOT NULL`);
    }

}
