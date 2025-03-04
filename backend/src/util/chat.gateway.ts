import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface SearchUser {
  socketId: string;
  userId: string;
}

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private searchQueue: SearchUser[] = [];

  // Начало поиска собеседника
  @SubscribeMessage('startSearch')
  handleSearch(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    console.log(`User ${userId} started searching...`);

    // Если уже есть кто-то в очереди — соединяем пользователей
    if (this.searchQueue.length > 0) {
      const partner = this.searchQueue.shift(); // Берём первого из очереди
      if (partner) {
        client.emit('matchFound', { roomId: partner.socketId });
        this.server
          .to(partner.socketId)
          .emit('matchFound', { roomId: client.id });
      }
    } else {
      // Добавляем в очередь
      this.searchQueue.push({ socketId: client.id, userId });
    }
  }

  // Отправка сообщения в чат
  @SubscribeMessage('sendMessage')
  handleMessage(@MessageBody() data: { roomId: string; message: string }) {
    this.server.to(data.roomId).emit('newMessage', data.message);
  }
}
