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
  private disconnectTimers: { [userId: string]: NodeJS.Timeout } = {};

  constructor(private messageService: MessageService) {}
  handleConnection(client: Socket) {
    const userId: string = client.handshake.query.userId as string;
    const username: string = client.handshake.query.username as string;

    if (userId && username) {
      this.users[client.id] = { userId, username, status: 'online' };
      console.log(`Пользователь ${username} (${userId}) подключился`);

      // Отменяем таймер, если пользователь вернулся
      if (this.disconnectTimers[userId]) {
        clearTimeout(this.disconnectTimers[userId]);
        delete this.disconnectTimers[userId];
        this.updatePartnerStatus(userId, 'online');
      }
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
      const roomId = Object.keys(this.rooms).find((room) =>
        this.rooms[room].includes(user.userId),
      );

      if (roomId) {
        console.log(roomId);
        this.server.to(roomId).emit('statusChanged', {
          userId: user.userId,
          status: 'offline',
        });
        this.rooms[roomId] = this.rooms[roomId].filter(
          (id) => id !== user.userId,
        );
      }
      delete this.users[client.id];
    }
  }

  private updatePartnerStatus(userId: string, status: string) {
    const roomId = Object.keys(this.rooms).find((room) =>
      this.rooms[room].includes(userId),
    );

    if (roomId) {
      const partnerSockets = this.rooms[roomId]
        .filter((id) => id !== userId)
        .map((id) => {
          const socket = this.server.sockets.sockets.get(id);
          return socket;
        });

      partnerSockets.forEach((socket) => {
        if (socket) {
          socket.emit('statusChanged', { userId, status });
        } else {
          // Если сокет undefined, отправляем событие userDisconnected
          const remainingUserId = this.rooms[roomId].find(
            (id) => id !== userId,
          );
          if (remainingUserId) {
            // Добавляем проверку на undefined
            const remainingSocket =
              this.server.sockets.sockets.get(remainingUserId);
            if (remainingSocket) {
              remainingSocket.emit('userDisconnected', { userId });
            }
          }
        }
      });
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
        if (!partnerUser) {
          console.error(
            `Ошибка: partnerUser не найден для partner.id ${partner.id}`,
          );
          client.emit('searchFailed', { message: 'Не удалось найти пару' });
          return;
        }

        if (partnerUser && user.userId === partnerUser.userId) {
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

        client.emit('matchFound', {
          roomId,
          partner: {
            userId: partnerUser.userId,
            username: partnerUser.username,
            status: partnerUser.status,
          },
        });
        partner.emit('matchFound', {
          roomId,
          partner: {
            userId: user.userId,
            username: user.username,
            status: user.status,
          },
        });
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
