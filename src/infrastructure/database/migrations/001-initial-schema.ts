import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1640000000001 implements MigrationInterface {
    name = 'InitialSchema1640000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Création de la table user
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" varchar PRIMARY KEY,
                "name" varchar,
                "biography" text,
                "json" jsonb,
                "nbFollowers" integer,
                "nbFollowings" integer,
                "nbPublications" integer,
                "instagramId" bigint,
                "facebookId" bigint,
                "category" varchar,
                "externalUrl" varchar,
                "profileUrl" varchar,
                "hasInfo" boolean NOT NULL DEFAULT false,
                "hasFollowerProcess" boolean NOT NULL DEFAULT false,
                "hasFollowingProcess" boolean NOT NULL DEFAULT false,
                "enable" boolean NOT NULL DEFAULT true,
                "maxIdFollower" varchar,
                "maxIdFollowing" varchar,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Création de la table hobby
        await queryRunner.query(`
            CREATE TABLE "hobby" (
                "id" SERIAL PRIMARY KEY,
                "name" varchar NOT NULL UNIQUE
            )
        `);

        // Création de la table hobby_keywords
        await queryRunner.query(`
            CREATE TABLE "hobby_keywords" (
                "hobby_id" integer NOT NULL,
                "keyword" varchar NOT NULL,
                "score" integer NOT NULL DEFAULT 0,
                PRIMARY KEY ("hobby_id", "keyword"),
                CONSTRAINT "FK_hobby_keywords_hobby" FOREIGN KEY ("hobby_id") REFERENCES "hobby"("id") ON DELETE CASCADE
            )
        `);

        // Création de la table weighting
        await queryRunner.query(`
            CREATE TABLE "weighting" (
                "userId" varchar NOT NULL,
                "hobbyId" integer NOT NULL,
                "score" bigint,
                "occurrences" integer,
                "following_occurrences" integer,
                "hobby_in_bio" integer,
                PRIMARY KEY ("userId", "hobbyId"),
                CONSTRAINT "FK_weighting_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_weighting_hobby" FOREIGN KEY ("hobbyId") REFERENCES "hobby"("id") ON DELETE CASCADE
            )
        `);

        // Tables de liaison
        await queryRunner.query(`
            CREATE TABLE "user_followers" (
                "user_id" varchar NOT NULL,
                "follower_id" varchar NOT NULL,
                PRIMARY KEY ("user_id", "follower_id"),
                CONSTRAINT "FK_user_followers_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_followers_follower" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_followings" (
                "user_id" varchar NOT NULL,
                "following_id" varchar NOT NULL,
                PRIMARY KEY ("user_id", "following_id"),
                CONSTRAINT "FK_user_followings_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_followings_following" FOREIGN KEY ("following_id") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_hobby" (
                "user_id" varchar NOT NULL,
                "hobby_id" integer NOT NULL,
                PRIMARY KEY ("user_id", "hobby_id"),
                CONSTRAINT "FK_user_hobby_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_hobby_hobby" FOREIGN KEY ("hobby_id") REFERENCES "hobby"("id") ON DELETE CASCADE
            )
        `);

        // Index pour les performances
        await queryRunner.query(`CREATE INDEX "IDX_user_instagramId" ON "user" ("instagramId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_facebookId" ON "user" ("facebookId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_category" ON "user" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_enable" ON "user" ("enable")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_hobby"`);
        await queryRunner.query(`DROP TABLE "user_followings"`);
        await queryRunner.query(`DROP TABLE "user_followers"`);
        await queryRunner.query(`DROP TABLE "weighting"`);
        await queryRunner.query(`DROP TABLE "hobby_keywords"`);
        await queryRunner.query(`DROP TABLE "hobby"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
