export interface Message {
  id: string;
  message: string;
  roomId: string;
  timestamp: Date;
  userId: string;
  isMine: boolean;
}

export interface User {
  userId: string;
  status: string;
  username: string;
  avatar: string;
}
