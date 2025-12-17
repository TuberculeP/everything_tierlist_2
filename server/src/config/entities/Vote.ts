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
import { Room } from "./Room";

@Entity()
@Unique(["userId", "itemId", "roomId"])
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

  @Column({ length: 10, nullable: true })
  tier: string; // S, A, B, C, D, ignored

  @UpdateDateColumn({ name: "modified_at" })
  modifiedAt: Date;

  @ManyToOne(() => Room, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "room_id" })
  room: Room | null;

  @Column({ name: "room_id", nullable: true })
  roomId: string | null;
}
