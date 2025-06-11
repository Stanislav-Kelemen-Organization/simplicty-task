import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestrictCategoryDeletion1749633223032
    implements MigrationInterface
{
    name = 'RestrictCategoryDeletion1749633223032';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "announcement_to_category"
            DROP CONSTRAINT "FK_d308a8af4ad244f329d2ffbbaa8"`);
        await queryRunner.query(`ALTER TABLE "announcement_to_category"
            ADD CONSTRAINT "FK_d308a8af4ad244f329d2ffbbaa8" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "announcement_to_category"
            DROP CONSTRAINT "FK_d308a8af4ad244f329d2ffbbaa8"`);
        await queryRunner.query(`ALTER TABLE "announcement_to_category"
            ADD CONSTRAINT "FK_d308a8af4ad244f329d2ffbbaa8" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }
}
