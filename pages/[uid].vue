<template>
    <div class="flex flex-col h-screen bg-gray-100">
        <div class="bg-white shadow-md px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <img class="w-10 h-10 rounded-full" :src="user.avatar" alt="Avatar" />
                <div>
                    <h2 class="text-lg font-semibold">{{ user.name }}</h2>
                    <span class="text-sm text-green-500">🟢 Онлайн</span>
                </div>
            </div>
            <button @click="disconnect" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
                Отключиться
            </button>
        </div>

        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-for="message in messages" :key="message.id" class="flex"
                :class="message.isMine ? 'justify-end' : 'justify-start'">
                <div class="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                    <p v-html="message.message"></p>
                </div>
            </div>
        </div>

        <div class="bg-white p-4 flex items-center gap-3 shadow-md">
            <button @click="toggleEmojiPicker" class="text-xl"></button>
            <input v-model="newMessage" type="text" placeholder="Введите сообщение..."
                class="flex-1 p-2 border rounded-lg outline-none" @keydown.enter="sendMessage" />
            <button @click="sendMessage()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                ➤ Отправить
            </button>
        </div>

        <vue-emoji-picker v-if="showEmojiPicker" @select="addEmoji"
            class="absolute bottom-16 left-4 bg-white shadow-lg" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { io } from "socket.io-client";
import VueEmojiPicker from "vue3-emoji-picker";

const socket = io("http://localhost:5000", {
    transports: ["websocket"],
});

const user = ref({ name: "Иван", avatar: "https://i.pravatar.cc/300" });

interface Data {
    id: number;
    message: string;
    roomId: string;
    timestamp: Date;
    userId: string;
    isMine: boolean;
}

const messages = ref<Data[]>([]);
const newMessage = ref("");
const showEmojiPicker = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const router = useRouter();
const roomId = ref("");
const userId = ref(typeof window !== "undefined" && localStorage.getItem("userId") || generateUserId());

function generateUserId() {
    const id = Math.random().toString(36).substring(2, 15);
    if (typeof window !== "undefined") {
        localStorage.setItem("userId", id);
    }
    return id;
}

socket.on("connect", () => {
    console.log("✅ Подключено к серверу! ID сокета:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Отключено от сервера");
});

socket.on("connect_error", (error) => {
    console.error("❌ Ошибка подключения:", error);
});

socket.on("newMessage", (message: { message: string; userId: string; roomId: string }) => {
    console.log("Получено новое сообщение:", message);
    console.log("message.userId:", message.userId);
    messages.value.push({
        id: Date.now(),
        message: message.message,
        userId: message.userId,
        roomId: message.roomId,
        timestamp: new Date(),
        isMine: message.userId === userId.value,
    });
    scrollToBottom();
});

socket.on("matchFound", (data: { roomId: string }) => {
    console.log("Найдена пара, roomId:", data.roomId);
    roomId.value = data.roomId;
    localStorage.setItem('roomId', data.roomId);
    getMessage(); // Загружаем историю сообщений после нахождения пары
});

socket.on("searchFailed", (data: { message: string }) => {
    console.error("Ошибка поиска:", data.message);
    // Добавьте уведомление пользователю об ошибке
});

socket.on("sendMessageFailed", (data: { message: string }) => {
    console.error("Ошибка отправки сообщения:", data.message);
    // Добавьте уведомление пользователю об ошибке
});

socket.on("userDisconnected", (data: { userId: string }) => {
    console.log("Пользователь отключился:", data.userId);
    // Добавьте уведомление пользователю об отключении собеседника
});

async function getMessage() {
    try {
        const roomId = localStorage.getItem('roomId');
        if (!roomId) {
            console.error("roomId не найден в localStorage");
            return;
        }
        const response = await fetch(`http://localhost:5000/messages/${roomId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const history: Data[] = await response.json();
        console.log("История сообщений:", history);
        messages.value = history.map((message: Data) => ({
            ...message,
            isMine: message.userId === userId.value,
        }));
        scrollToBottom();
    } catch (error) {
        console.error("Ошибка при получении истории сообщений:", error);
    }
}

onMounted(async () => {
    console.log("userId:", userId.value);
    socket.on("room", (room: string) => {
        console.log("Получен roomId:", room);
        roomId.value = room;
        localStorage.setItem('roomId', room);
    });

    await getMessage(); // Загружаем историю сообщений при подключении

    socket.emit("startSearch");
});

onUnmounted(() => {
    socket.disconnect();
});

const sendMessage = () => {
    if (!newMessage.value.trim()) return;
    const newMessageData: Data = {
        id: Date.now(),
        message: newMessage.value,
        userId: userId.value,
        roomId: localStorage.getItem('roomId') || '',
        timestamp: new Date(),
        isMine: true,
    };
    scrollToBottom();
    socket.emit("sendMessage", {
        message: newMessage.value,
        userId: userId.value,
        roomId: localStorage.getItem('roomId'),
    });
    newMessage.value = "";
};

const addEmoji = (emoji: any) => {
    newMessage.value += emoji.i;
    showEmojiPicker.value = false;
};

const scrollToBottom = () => {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTo({
                top: chatContainer.value.scrollHeight,
                behavior: "smooth",
            });
        }
    });
};

const disconnect = () => {
    console.log(" Отключился от чата");
    socket.emit("disconnectUser", { userId: userId.value, roomId: roomId.value });
    router.push("/");
};

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
};
</script>