import {MigrationInterface, QueryRunner} from "typeorm";

export class RenamedSlugField1635687865625 implements MigrationInterface {
    name = 'RenamedSlugField1635687865625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "slag" TO "slug"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "slug" TO "slag"`);
    }

}
