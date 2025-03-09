import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from 'src/tasks/message.service';
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private queue: Socket[] = []; // Очередь пользователей в поиске

  constructor(private messageService: MessageService) {} // Внедрение MessageService

  handleDisconnect(client: Socket) {
    console.log(`❌ Клиент отключился: ${client.id}`);
    this.queue = this.queue.filter((user) => user.id !== client.id);
    console.log(
      ` Текущая очередь после отключения: ${this.queue.map((c) => c.id).join(', ')}`,
    );
  }

  @SubscribeMessage('startSearch')
  handleSearch(client: Socket) {
    console.log(` Клиент ${client.id} начал поиск`);

    console.log(
      ` Очередь перед поиском: ${this.queue.map((c) => c.id).join(', ')}`,
    );

    if (this.queue.length > 0) {
      const partner = this.queue.shift();

      if (!partner) {
        console.error('❌ Ошибка: partner оказался undefined');
        return;
      }

      const roomId = `room_${client.id}_${partner.id}`;
      console.log(
        `✅ Найдена пара: ${client.id} ↔ ${partner.id} (комната: ${roomId})`,
      );

      client.join(roomId);
      partner.join(roomId);

      client.emit('matchFound', { roomId });
      partner.emit('matchFound', { roomId });
    } else {
      console.log(`⏳ Клиент ${client.id} встал в очередь`);
      this.queue.push(client);
    }

    console.log(
      ` Очередь после поиска: ${this.queue.map((c) => c.id).join(', ')}`,
    );
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: string; message: string; userId: string },
  ) {
    try {
      const message = await this.messageService.create({
        roomId: data.roomId,
        userId: data.userId,
        message: data.message,
        timestamp: new Date(),
      });
      this.server.to(data.roomId).emit('newMessage', message);
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error);
    }
  }
}
