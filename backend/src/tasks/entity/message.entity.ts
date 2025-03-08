
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: string;

  @Column()
  userId: string;

  @Column()
  message: string;

  @Column()
  timestamp: Date;
}