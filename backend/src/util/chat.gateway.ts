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
  private rooms: { [roomId: string]: string[] } = {};
  private users: {
    [socketId: string]: { userId: string; username: string; status: string };
  } = {};

  constructor(private messageService: MessageService) {}

  handleConnection(client: Socket) {
    const userId: string = client.handshake.query.userId as string;
    const username: string = client.handshake.query.username as string;

    if (userId && username) {
      this.users[client.id] = { userId, username, status: 'online' };
      console.log(`Пользователь ${username} (${userId}) подключился`);
    } else {
      console.error(
        `Ошибка: userId или username невалидны для клиента ${client.id}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.users[client.id];

    if (user) {
      user.status = 'offline';
      console.log(`Пользователь ${user.username} (${user.userId}) отключился`);

      // Находим комнату, в которой был пользователь
      const roomId = Object.keys(this.rooms).find((room) =>
        this.rooms[room].includes(user.userId),
      );

      if (roomId) {
        // Удаляем пользователя из комнаты
        this.rooms[roomId] = this.rooms[roomId].filter(
          (id) => id !== user.userId,
        );

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

      delete this.users[client.id];
    }
  }

  @SubscribeMessage('startSearch')
  handleSearch(client: Socket) {
    const user = this.users[client.id];

    if (user) {
      console.log(`Пользователь ${user.username} (${user.userId}) начал поиск`);

      if (this.queue.length > 0) {
        const partner = this.queue.shift();
        if (!partner) {
          client.emit('searchFailed', { message: 'Не удалось найти пару' });
          return;
        }

        const partnerUser = this.users[partner.id];

        // Проверяем, не является ли userId одинаковым
        if (user.userId === partnerUser.userId) {
          console.error(
            `Ошибка: Нельзя создать комнату с одним и тем же userId`,
          );
          client.emit('searchFailed', {
            message: 'Нельзя создать комнату с самим собой',
            code: 400,
          });
          return;
        }

        const roomId = `room_${user.userId}_${partnerUser.userId}`;
        client.join(roomId);
        partner.join(roomId);

        client.emit('matchFound', { roomId });
        partner.emit('matchFound', { roomId });
        this.rooms[roomId] = [user.userId, partnerUser.userId];
        console.log(
          `Комната ${roomId} создана для ${user.userId} и ${partnerUser.userId}`,
        );
      } else {
        this.queue.push(client);
      }
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
      );
    } catch (error) {
      client.emit('sendMessageFailed', {
        message: 'Не удалось отправить сообщение',
      });
    }
  }
}
