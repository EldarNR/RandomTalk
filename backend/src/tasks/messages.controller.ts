import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MessageService } from './message.service';
import { Message } from './entity/message.entity';

@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessageService) {}

  @Post()
  async create(@Body() message: Partial<Message>): Promise<Message> {
    return this.messagesService.create(message);
  }

  @Get(':roomId')
  async findAllByRoomId(@Param('roomId') roomId: string): Promise<Message[]> {
    return this.messagesService.findByRoomId(roomId);
  }
}
