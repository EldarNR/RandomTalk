export interface Message {
  id: string;
  message: string;
  roomId: string;
  timestamp: Date;
  userId: string;
  isMine: boolean;
}

export interface User {
  name: string;
  avatar: string;
}
