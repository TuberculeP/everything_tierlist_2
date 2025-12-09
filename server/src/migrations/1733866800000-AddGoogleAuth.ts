import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGoogleAuth1733866800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ajouter la colonne googleId (nullable, unique)
    await queryRunner.addColumn(
      "user",
      new TableColumn({
        name: "googleId",
        type: "varchar",
        length: "255",
        isNullable: true,
        isUnique: true,
      }),
    );

    // 2. Rendre password nullable (pour les utilisateurs Google)
    await queryRunner.changeColumn(
      "user",
      "password",
      new TableColumn({
        name: "password",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Supprimer la colonne googleId
    await queryRunner.dropColumn("user", "googleId");

    // 2. Remettre password en NOT NULL (attention: peut échouer si des users Google existent)
    await queryRunner.changeColumn(
      "user",
      "password",
      new TableColumn({
        name: "password",
        type: "varchar",
        length: "255",
        isNullable: false,
      }),
    );
  }
}
