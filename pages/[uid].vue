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
                    <p v-html="message.text"></p>
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

const messages = ref<{ id: number; text: string; isMine: boolean }[]>([]);
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

socket.on("newMessage", (message: { message: string; userId: string; roomId: string }) => {
    console.log("Получено новое сообщение:", message);
    messages.value.push({
        id: Date.now(),
        text: message.message,
        isMine: message.userId === userId.value,
    });
    scrollToBottom();
});

onMounted(() => {
    console.log(" Подключение к WebSocket...");

    socket.on("connect", () => {
        console.log("✅ Подключено к серверу! ID сокета:", socket.id);

        socket.on("room", (room: string) => {
            console.log("Получен roomId:", room);
            roomId.value = room;
            localStorage.setItem('roomId', room); // Сохраняем roomId в localStorage
        });

        socket.emit("getHistory", localStorage.getItem('roomId'));
        socket.on("history", (history: any[]) => {
            messages.value = history;
            scrollToBottom();
        });

        socket.emit("startSearch");
    });

    socket.on("connect_error", (error) => {
        console.error("❌ Ошибка подключения:", error);
    });
});

onUnmounted(() => {
    socket.disconnect();
});

const sendMessage = () => {
    if (!newMessage.value.trim()) return;
    socket.emit("sendMessage", {
        message: newMessage.value,
        userId: userId.value,
        roomId: localStorage.getItem('roomId'), // Получаем roomId из localStorage
    });
    console.log({
        message: newMessage.value,
        userId: userId.value,
        roomId: localStorage.getItem('roomId'),
    })

    newMessage.value = "";
};

const addEmoji = (emoji: any) => {
    newMessage.value += emoji.i;
    showEmojiPicker.value = false;
};

const scrollToBottom = () => {
    nextTick(() => {
        console.log("Вызов scrollToBottom");
        chatContainer.value?.scrollTo({
            top: chatContainer.value.scrollHeight,
            behavior: "smooth",
        });
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