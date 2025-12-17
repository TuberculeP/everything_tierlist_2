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
export class PushSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @Column({ unique: true })
  endpoint: string;

  @Column("simple-json")
  keys: { p256dh: string; auth: string };

  @CreateDateColumn({ nullable: true })
  lastNotifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
