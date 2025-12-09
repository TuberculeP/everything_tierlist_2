import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { Item } from "./Item";

@Entity()
@Unique(["userId", "itemId"]) // Un seul vote par user par item
export class Vote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Item, { onDelete: "CASCADE" })
  @JoinColumn({ name: "item_id" })
  item: Item;

  @Column({ name: "item_id" })
  itemId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ length: 1 })
  tier: string; // S, A, B, C, D

  @UpdateDateColumn({ name: "modified_at" })
  modifiedAt: Date;
}
