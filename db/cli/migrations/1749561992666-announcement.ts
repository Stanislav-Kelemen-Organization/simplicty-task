import { MigrationInterface, QueryRunner } from 'typeorm';

export class Announcement1749561992666 implements MigrationInterface {
    name = 'Announcement1749561992666';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category"
                             (
                                 "id"         SERIAL                   NOT NULL,
                                 "name"       character varying(255)   NOT NULL,
                                 "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id")
                             )`);
        await queryRunner.query(`CREATE TABLE "announcement"
                             (
                                 "id"           SERIAL                   NOT NULL,
                                 "title"        character varying(1000)  NOT NULL,
                                 "content"      text                     NOT NULL,
                                 "published_at" TIMESTAMP WITH TIME ZONE,
                                 "created_at"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "updated_at"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 CONSTRAINT "PK_e0ef0550174fd1099a308fd18a0" PRIMARY KEY ("id")
                             )`);
        await queryRunner.query(`CREATE TABLE "announcement_to_category"
                             (
                                 "announcement_id" integer NOT NULL,
                                 "category_id"     integer NOT NULL,
                                 CONSTRAINT "PK_c878483a2579e0b39ea40118290" PRIMARY KEY ("announcement_id", "category_id")
                             )`);
        await queryRunner.query(
            `CREATE INDEX "IDX_4cbc723a40f1548f0104f70373" ON "announcement_to_category" ("announcement_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_d308a8af4ad244f329d2ffbbaa" ON "announcement_to_category" ("category_id") `,
        );
        await queryRunner.query(`ALTER TABLE "announcement_to_category"
        ADD CONSTRAINT "FK_4cbc723a40f1548f0104f703737" FOREIGN KEY ("announcement_id") REFERENCES "announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "announcement_to_category"
        ADD CONSTRAINT "FK_d308a8af4ad244f329d2ffbbaa8" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "announcement_to_category" DROP CONSTRAINT "FK_d308a8af4ad244f329d2ffbbaa8"`,
        );
        await queryRunner.query(
            `ALTER TABLE "announcement_to_category" DROP CONSTRAINT "FK_4cbc723a40f1548f0104f703737"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_d308a8af4ad244f329d2ffbbaa"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_4cbc723a40f1548f0104f70373"`,
        );
        await queryRunner.query(`DROP TABLE "announcement_to_category"`);
        await queryRunner.query(`DROP TABLE "announcement"`);
        await queryRunner.query(`DROP TABLE "category"`);
    }
}
