import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueCategories1749595195085 implements MigrationInterface {
    name = 'UniqueCategories1749595195085';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category"
            ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`,
        );
    }
}
