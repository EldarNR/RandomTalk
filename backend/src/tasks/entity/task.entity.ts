import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()  // Указывает, что это таблица в базе данных
export class Task {
  @PrimaryGeneratedColumn()
  id: number; // Уникальный идентификатор (автоинкремент)

  @Column()
  title: string; // Название задачи

  @Column({ default: false })
  completed: boolean; // Статус выполнения
}
