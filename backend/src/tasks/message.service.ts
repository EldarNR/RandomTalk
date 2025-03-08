import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entity/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async create(message: Partial<Message>): Promise<Message> {
    console.log("Сохранение сообщения:", message);
    return this.messageRepository.save(message as Message);
  }
  async findByRoomId(roomId: string): Promise<Message[]> {
    return this.messageRepository.find({ where: { roomId } });
  }
}
