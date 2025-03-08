// tasks.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entity/task.entity';
import { MessageService } from './message.service';
import { Message } from './entity/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Message])], // Импортируем Task и Message
  providers: [TasksService, MessageService], // Регистрируем TasksService и MessageService
  controllers: [TasksController], // Регистрируем TasksController
  exports: [TasksService, MessageService], // Экспортируем TasksService и MessageService
})
export class TasksModule {}