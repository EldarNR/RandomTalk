import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './util/chat.gateway';

@Module({
  controllers: [AppController],
  providers: [AppService, ChatGateway],
  imports: [
    TasksModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: 'postgres',
      password: 'password', // убедись, что совпадает с docker-compose.yml
      database: 'postgres', // <-- исправлено
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
