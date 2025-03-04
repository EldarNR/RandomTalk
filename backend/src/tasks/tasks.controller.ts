import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './entity/task.entity';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getAllTasks(): Promise<Task[]> {
    return this.tasksService.getAllTasks();
  }

  @Post()
  @HttpCode(200)
  createTask(@Body() body: { title: string }): Promise<Task> {
    console.log('Body received:', body);
    return this.tasksService.createTask(body.title);
  }
}
