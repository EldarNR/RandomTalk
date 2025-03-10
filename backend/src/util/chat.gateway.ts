// chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  OnGatewayDisconnect,
  ConnectedSocket,
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
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private queue: Socket[] = [];

  constructor(private messageService: MessageService) {}

  handleDisconnect(client: Socket) {
    console.log(`Пользователь ${client.id} отключился`);
    const rooms = Object.keys(client.rooms).filter((room) => room !== client.id);
    rooms.forEach((room) => {
      this.server.to(room).emit('userDisconnected', { userId: client.id });
    });
  }

  @SubscribeMessage('startSearch')
  handleSearch(client: Socket) {
    console.log(`Клиент ${client.id} начал поиск`);
    console.log(`Очередь перед поиском: ${this.queue.map((c) => c.id).join(', ')}`);

    if (this.queue.length > 0) {
      const partner = this.queue.shift();
      if (!partner) {
        console.error('❌ Ошибка: partner оказался undefined');
        client.emit('searchFailed', { message: 'Не удалось найти пару' });
        return;
      }

      const roomId = `room_${client.id}_${partner.id}`;
      console.log(`✅ Найдена пара: ${client.id} ↔ ${partner.id} (комната: ${roomId})`);

      client.join(roomId);
      partner.join(roomId);

      client.emit('matchFound', { roomId });
      partner.emit('matchFound', { roomId });
    } else {
      console.log(`⏳ Клиент ${client.id} встал в очередь`);
      this.queue.push(client);
    }

    console.log(`Очередь после поиска: ${this.queue.map((c) => c.id).join(', ')}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: string; message: string; userId: string },
    @ConnectedSocket() client: Socket, // Добавьте эту строку
  ) {
    try {
      const message = await this.messageService.create({
        roomId: data.roomId,
        userId: data.userId,
        message: data.message,
        timestamp: new Date(),
      });
      this.server.to(data.roomId).emit('newMessage', message);
      console.log(`✅ Сообщение отправлено: ${data.message} в комнату ${data.roomId}`);
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error);
      client.emit('sendMessageFailed', { message: 'Не удалось отправить сообщение' });
    }
  }
}