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
  private rooms: { [userId: string]: string[] } = {}; // Тип: массив строк

  constructor(private messageService: MessageService) {}

  handleDisconnect(client: Socket) {
    const userId: string = client.handshake.query.userId as string;
    console.log(`Пользователь ${client.id} отключился`);

    // Находим комнату, в которой был пользователь
    const roomId = Object.keys(this.rooms).find((room) =>
      this.rooms[room].includes(userId),
    );

    if (roomId) {
      // Удаляем пользователя из комнаты
      this.rooms[roomId] = this.rooms[roomId].filter((id) => id !== userId);

      if (this.rooms[roomId].length === 1) {
        // В комнате остался один пользователь
        const remainingUserId = this.rooms[roomId][0];
        const remainingSocket =
          this.server.sockets.sockets.get(remainingUserId);

        if (remainingSocket) {
          // Уведомляем оставшегося пользователя
          remainingSocket.emit('roomClosed');
          // Отключаем оставшегося пользователя от комнаты
          remainingSocket.leave(roomId);
        }

        // Удаляем комнату
        delete this.rooms[roomId];
        console.log(`Комната ${roomId} закрыта`);
      }
    }
  }
  @SubscribeMessage('startSearch')
  handleSearch(client: Socket) {
    const userId: string = client.handshake.query.userId as string;
    console.log(client.handshake.query);

    if (userId === undefined) {
      // Проверка на undefined
      console.error(`Ошибка: userId невалиден для клиента ${client.id}`);
      client.emit('searchFailed', { message: 'userId невалиден', code: 404 });
      return;
    }
    console.log(`Клиент ${client.id} начал поиск`);
    if (this.queue.length > 0) {
      const partner = this.queue.shift();
      if (!partner) {
        client.emit('searchFailed', { message: 'Не удалось найти пару' });
        return;
      }
      const partnerUserId: string = partner.handshake.query.userId as string;

      // Проверяем, не является ли userId одинаковым
      if (userId === partnerUserId) {
        console.error(`Ошибка: Нельзя создать комнату с одним и тем же userId`);
        client.emit('searchFailed', {
          message: 'Нельзя создать комнату с самим собой',
          code: 400,
        });
        return;
      }

      const roomId = `room_${userId}_${partnerUserId}`;
      client.join(roomId);
      partner.join(roomId);

      client.emit('matchFound', { roomId });
      partner.emit('matchFound', { roomId });
      this.rooms[userId] = [roomId]; // Исправлено: массив строк
      this.rooms[partnerUserId] = [roomId]; // Исправлено: массив строк
      console.log(`Комната ${roomId} создана для ${userId} и ${partnerUserId}`);
    } else {
      this.queue.push(client);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: string; message: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messageService.create({
        roomId: data.roomId,
        userId: data.userId,
        message: data.message,
        timestamp: new Date(),
      });
      this.server.to(data.roomId).emit('newMessage', message);
      console.log(
        `Сообщение ${data.message} отправлено в комнату ${data.roomId}`,
      ); // Добавлено логирование
    } catch (error) {
      client.emit('sendMessageFailed', {
        message: 'Не удалось отправить сообщение',
      });
    }
  }
}
