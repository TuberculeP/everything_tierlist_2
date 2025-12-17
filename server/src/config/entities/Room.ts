import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 12, unique: true })
  hash: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
