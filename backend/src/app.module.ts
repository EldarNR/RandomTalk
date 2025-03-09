import { Module } from '@nestjs/common';
import { TasksController } from './tasks/tasks.controller';
import { TasksModule } from './tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './util/chat.gateway'; // Убедитесь, что путь правильный
import { MessagesModule } from './tasks/messages.module';
@Module({
  controllers: [TasksController],
  providers: [ChatGateway],
  imports: [
    TasksModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: 'postgres',
      password: 'password',
      database: 'postgres',
      autoLoadEntities: true,
      synchronize: true,
    }),
    MessagesModule,
  ],
})
export class AppModule {}
