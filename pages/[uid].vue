<template>
    <div class="flex flex-col h-screen bg-gray-100">
        <ChatHeader :user="user" @disconnect="disconnect" />
        <MessageList :messages="messages" ref="messageList" />
        <MessageInput @send-message="handleSendMessage" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { io } from 'socket.io-client';

import ChatHeader from '~/components/chat-page/chat-head.vue';
import MessageList from '~/components/chat-page/message-list.vue';
import MessageInput from '~/components/chat-page/message-Input.vue';

import { generateUserId } from '~/components/func/generateUserId';
import type { Message, User } from '~/components/chat-page/types/chat.types.js';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase; // API
const user = ref<User>({ name: 'Иван', avatar: 'https://i.pravatar.cc/300' });
const messages = ref<Message[]>([]);
const router = useRouter();
const roomId = ref('');
const messageList = ref<InstanceType<typeof MessageList> | null>(null);
let userId = ref<string>(localStorage.getItem("userId") || generateUserId());
let socket = io(apiBase, {
    query: { userId: userId.value }, // Передача userId
});

if (userId.value) {
    localStorage.setItem("userId", userId.value); // Сохраняем userId в localStorage
    socket = io(apiBase, {
        query: { userId: userId.value },
    });
} else {
    console.error("userId не определен");
    // Обработайте случай, когда userId не определен
}

console.log('userId при подключении:', userId.value);
// WebSocket Events
socket.on('connect', () => console.log('✅ Подключено к серверу! ID сокета:', socket.id));
socket.on('disconnect', () => console.log('❌ Отключено от сервера'));
socket.on('connect_error', (error) => console.error('❌ Ошибка подключения:', error));
socket.on('newMessage', handleNewMessage);
socket.on('matchFound', handleMatchFound);
socket.on('searchFailed', handleSearchFailed);
socket.on('sendMessageFailed', handleSendMessageFailed);
socket.on('userDisconnected', handleUserDisconnected);
socket.on('roomClosed', () => {
    console.log('Собеседник покинул комнату');
    router.push('/');
});
function handleMatchFound(data: { roomId: string }) {
    console.log('Найдена пара, roomId:', data.roomId);
    roomId.value = data.roomId;
    localStorage.setItem('roomId', data.roomId);
    getMessage();
}

function handleSearchFailed(data: { message: string }) {
    console.error('Ошибка поиска:', data.message);
    // Добавьте уведомление пользователю об ошибке
}

function handleSendMessageFailed(data: { message: string }) {
    console.error('Ошибка отправки сообщения:', data.message);
    // Добавьте уведомление пользователю об ошибке
}

function handleUserDisconnected(data: { userId: string }) {
    console.log('Пользователь отключился:', data.userId);
    // Добавьте уведомление пользователю об отключении собеседника
}

async function getMessage() {
    try {
        const roomId = localStorage.getItem('roomId');
        if (!roomId) {
            console.error('roomId не найден в localStorage');
            return;
        }
        const response = await fetch(`${apiBase}/messages/${roomId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const history: Message[] = await response.json();
        messages.value = history.map((message: Message) => ({
            ...message,
            isMine: message.userId === userId.value,
        }));
        messageList.value?.scrollToBottom();
        localStorage.setItem('chatMessages', JSON.stringify(messages.value)); // Сохранение сообщений
    } catch (error) {
        console.error('Ошибка при получении истории сообщений:', error);
    }
}

function handleSendMessage(message: string) {
    const newMessage: Message = {
        id: crypto.randomUUID(),
        message,
        userId: userId.value,
        roomId: localStorage.getItem('roomId') || '',
        timestamp: new Date(),
        isMine: true,
    };
    messages.value.push(newMessage); // Добавляем сообщение в messages
    messageList.value?.scrollToBottom();
    socket.emit('sendMessage', {
        message,
        userId: userId.value,
        roomId: localStorage.getItem('roomId'),
    });
    localStorage.setItem('chatMessages', JSON.stringify(messages.value)); // Сохранение сообщений
}

function handleNewMessage(message: Message) {
    console.log('Получено новое сообщение:', message);
    // Проверяем, является ли сообщение вашим собственным
    if (message.userId !== userId.value) {
        messages.value.push({ ...message, isMine: message.userId === userId.value });
        messageList.value?.scrollToBottom();
        localStorage.setItem('chatMessages', JSON.stringify(messages.value)); // Сохранение сообщений
    }
}

function disconnect() {
    console.log('Отключился от чата');
    socket.emit('disconnectUser', { userId: userId.value, roomId: roomId.value });
    router.push('/');
}

onMounted(async () => {
    console.log('userId:', userId.value);
    socket.on('room', (room: string) => {
        console.log('Получен roomId:', room);
        roomId.value = room;
        localStorage.setItem('roomId', room);
    });
    // Загрузка сообщений из localStorage
    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
        messages.value = JSON.parse(storedMessages);
    }

    await getMessage();
    socket.emit('startSearch');
});

onUnmounted(() => {
    localStorage.removeItem('chatMessages');
    socket.disconnect();
});
</script>