<template>
    <div class="flex flex-col h-screen bg-gray-100" v-if="partner">
        <Error class="absolute" />
        <ChatHeader :user="partner" @disconnect="disconnect" />
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
import Error from '~/components/Error.vue';

import emitter from '~/components/func/mitt';
import { generateUserId } from '~/components/func/generateUserId';
import type { Message, User } from '~/components/chat-page/types/chat.types.js';
import { NuxtLink } from '#components';

interface PartnerUser extends User {
    userId: string;
}

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const partner = ref<PartnerUser | null>(null);
const messages = ref<Message[]>([]);
const router = useRouter();
const roomId = ref('');
const messageList = ref<InstanceType<typeof MessageList> | null>(null);

function useLocalStorage() {
    function getItem(key: string): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
        }
        return null;
    }

    function setItem(key: string, value: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
        }
    }

    function removeItem(key: string): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    }

    return { getItem, setItem, removeItem };
}

const { getItem, setItem, removeItem } = useLocalStorage();

let userId = ref<string>(getItem('userId') || generateUserId());
const username = ref<string>(getItem('username') || 'Anonymous');

let socket = io(apiBase, {
    query: { userId: userId.value, username: username.value },
});

console.log('userId при подключении:', userId.value);

socket.on('connect', () => console.log('✅ Подключено к серверу! ID сокета:', socket.id));
socket.on('disconnect', () => console.log('❌ Отключено от сервера'));
socket.on('connect_error', (error) => {
    console.error('❌ Ошибка подключения:', error);
    emitter.emit('show-error', `Ошибка подключения: ${error.message}`);
});
socket.on('newMessage', handleNewMessage);
socket.on('matchFound', handleMatchFound);
socket.on('searchFailed', handleSearchFailed);
socket.on('sendMessageFailed', handleSendMessageFailed);
socket.on('userDisconnected', handleUserDisconnected);
socket.on('roomClosed', () => {
    console.log('Собеседник покинул комнату');
    router.push('/');
});
socket.on('statusChanged', (data: PartnerUser) => {
    if (partner.value && partner.value.userId === data.userId) {
        partner.value.status = data.status;
    }
});

function handleMatchFound(data: { roomId: string; partner: User }) {
    roomId.value = data.roomId;
    const partnerWithUserId: PartnerUser = {
        ...data.partner,
        userId: data.partner.userId,
    };
    partner.value = partnerWithUserId;
    setItem('roomId', data.roomId);
    getMessage();
}

async function getMessage() {
    try {
        const roomIdValue = getItem('roomId');
        console.log('getMessage, roomId:', roomIdValue);
        if (!roomIdValue) {
            console.error('roomId не найден в localStorage');
            emitter.emit('show-error', 'roomId не найден в localStorage');
            return;
        }
        const response = await fetch(`${apiBase}/messages/${roomIdValue}`);
        if (!response.ok) {
            const errorMessage = `HTTP error! status: ${response.status}`;
            console.error(errorMessage);
            emitter.emit('show-error', errorMessage);
            return;
        }
        const history: Message[] = await response.json();
        messages.value = history.map((message: Message) => ({
            ...message,
            isMine: message.userId === userId.value,
        }));
        messageList.value?.scrollToBottom();
        setItem('chatMessages', JSON.stringify(messages.value));
    } catch (error) {
        console.error('Ошибка при получении истории сообщений:', error);
        emitter.emit('show-error', 'Ошибка при получении истории сообщений');
    }
}

function handleSearchFailed(data: { message: string }) {
    console.error('Ошибка поиска:', data.message);
    emitter.emit('show-error', data.message);
    navigateTo('/');
}

function handleSendMessageFailed(data: { message: string }) {
    console.error('Ошибка отправки сообщения:', data.message);
    emitter.emit('show-error', data.message);
}

function handleUserDisconnected(data: { userId: string }) {
    console.log('Пользователь отключился:', data.userId);
}

function handleSendMessage(message: string) {
    const newMessage: Message = {
        id: crypto.randomUUID(),
        message,
        userId: userId.value,
        roomId: getItem('roomId') || '',
        timestamp: new Date(),
        isMine: true,
    };
    messages.value.push(newMessage);
    messageList.value?.scrollToBottom();
    socket.emit('sendMessage', {
        message,
        userId: userId.value,
        roomId: getItem('roomId'),
    });
    setItem('chatMessages', JSON.stringify(messages.value));
}

function handleNewMessage(message: Message) {
    console.log('Получено новое сообщение:', message);
    if (message.userId !== userId.value) {
        messages.value.push({ ...message, isMine: message.userId === userId.value });
        messageList.value?.scrollToBottom();
        setItem('chatMessages', JSON.stringify(messages.value));
    }
}

function disconnect() {
    socket.emit('disconnectUser', { userId: userId.value, roomId: roomId.value });
    router.push('/');
}

onMounted(async () => {
    console.log('userId:', userId.value);
    socket.on('room', (room: string) => {
        console.log('Получен roomId:', room);
        roomId.value = room;
        setItem('roomId', room);
    });
    const storedMessages = getItem('chatMessages');
    if (storedMessages) {
        messages.value = JSON.parse(storedMessages);
    }
    await getMessage();
    socket.emit('startSearch');
});

onUnmounted(() => {
    removeItem('chatMessages');
    socket.disconnect();
});
</script>