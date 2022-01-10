import {MigrationInterface, QueryRunner} from "typeorm";

export class SeedDB1634410934776 implements MigrationInterface {
    name = 'SeedDB1634410934776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO tags (name) VALUES ('react'), ('test'), ('nestJS')`);

        //password = test
        await queryRunner.query(`INSERT INTO users (username, email, password) VALUES ('test', 'test@gmail.com', '$2b$10$BqDMZWlM.9D0lKZIRgYKPOcf4GKXx16ZmqLjzX/CdaxMoIvW89COS')`);

        await queryRunner.query(`INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES('first-article', 'First article', 'First article desc', 'First article body', 'react,test', 1)`);

        await queryRunner.query(`INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES('second-article', 'Second article', 'Second article desc', 'Second article body', 'react,test2', 1)`);

    }

    public async down(): Promise<void> {}

}
