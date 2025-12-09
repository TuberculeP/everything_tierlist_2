import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class MergeFirstNameLastNameToPseudo1733780400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres =
      queryRunner.connection.driver.options.type === "postgres";

    // 1. Ajouter la colonne pseudo
    await queryRunner.addColumn(
      "user",
      new TableColumn({
        name: "pseudo",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    // 2. Copier les données firstName + lastName vers pseudo
    if (isPostgres) {
      await queryRunner.query(
        `UPDATE "user" SET "pseudo" = CONCAT("firstName", ' ', "lastName")`,
      );
    } else {
      await queryRunner.query(
        `UPDATE "user" SET "pseudo" = "firstName" || ' ' || "lastName"`,
      );
    }

    // 3. Rendre pseudo NOT NULL
    await queryRunner.changeColumn(
      "user",
      "pseudo",
      new TableColumn({
        name: "pseudo",
        type: "varchar",
        length: "255",
        isNullable: false,
      }),
    );

    // 4. Supprimer les anciennes colonnes
    await queryRunner.dropColumn("user", "firstName");
    await queryRunner.dropColumn("user", "lastName");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Recréer les colonnes firstName et lastName
    await queryRunner.addColumn(
      "user",
      new TableColumn({
        name: "firstName",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      "user",
      new TableColumn({
        name: "lastName",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    // 2. Récupérer les données depuis pseudo
    await queryRunner.query(`UPDATE "user" SET "firstName" = "pseudo"`);
    await queryRunner.query(`UPDATE "user" SET "lastName" = ''`);

    // 3. Rendre NOT NULL
    await queryRunner.changeColumn(
      "user",
      "firstName",
      new TableColumn({
        name: "firstName",
        type: "varchar",
        length: "255",
        isNullable: false,
      }),
    );
    await queryRunner.changeColumn(
      "user",
      "lastName",
      new TableColumn({
        name: "lastName",
        type: "varchar",
        length: "255",
        isNullable: false,
      }),
    );

    // 4. Supprimer la colonne pseudo
    await queryRunner.dropColumn("user", "pseudo");
  }
}
