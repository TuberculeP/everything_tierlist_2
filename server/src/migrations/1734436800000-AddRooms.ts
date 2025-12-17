import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableUnique,
} from "typeorm";

export class AddRooms1734436800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Créer la table room
    await queryRunner.createTable(
      new Table({
        name: "room",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "hash",
            type: "varchar",
            length: "12",
            isUnique: true,
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "user_id",
            type: "uuid",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    // 2. Ajouter la FK user_id sur room
    await queryRunner.createForeignKey(
      "room",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "user",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // 3. Ajouter room_id sur item
    await queryRunner.addColumn(
      "item",
      new TableColumn({
        name: "room_id",
        type: "uuid",
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      "item",
      new TableForeignKey({
        columnNames: ["room_id"],
        referencedTableName: "room",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // 4. Ajouter room_id sur vote
    await queryRunner.addColumn(
      "vote",
      new TableColumn({
        name: "room_id",
        type: "uuid",
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      "vote",
      new TableForeignKey({
        columnNames: ["room_id"],
        referencedTableName: "room",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // 5. Supprimer l'ancienne contrainte unique sur vote (user_id, item_id)
    const voteTable = await queryRunner.getTable("vote");
    const oldUnique = voteTable?.uniques.find(
      (u) =>
        u.columnNames.includes("user_id") &&
        u.columnNames.includes("item_id") &&
        u.columnNames.length === 2,
    );
    if (oldUnique) {
      await queryRunner.dropUniqueConstraint("vote", oldUnique);
    }

    // 6. Créer la nouvelle contrainte unique (user_id, item_id, room_id)
    await queryRunner.createUniqueConstraint(
      "vote",
      new TableUnique({
        columnNames: ["user_id", "item_id", "room_id"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Supprimer la nouvelle contrainte unique
    const voteTable = await queryRunner.getTable("vote");
    const newUnique = voteTable?.uniques.find(
      (u) =>
        u.columnNames.includes("user_id") &&
        u.columnNames.includes("item_id") &&
        u.columnNames.includes("room_id"),
    );
    if (newUnique) {
      await queryRunner.dropUniqueConstraint("vote", newUnique);
    }

    // 2. Recréer l'ancienne contrainte unique
    await queryRunner.createUniqueConstraint(
      "vote",
      new TableUnique({
        columnNames: ["user_id", "item_id"],
      }),
    );

    // 3. Supprimer room_id de vote (FK sera supprimée automatiquement)
    await queryRunner.dropColumn("vote", "room_id");

    // 4. Supprimer room_id de item
    await queryRunner.dropColumn("item", "room_id");

    // 5. Supprimer la table room
    await queryRunner.dropTable("room");
  }
}
