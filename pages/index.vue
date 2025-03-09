<template>
    <div class="flex items-center justify-center h-screen bg-gradient-to-br from-red-400 to-purple-500">
        <div class="bg-white shadow-xl rounded-lg p-6 w-96 text-center">
            <h1 class="text-2xl font-bold text-gray-800 mb-4">🔥 Чат-рулетка 🔥</h1>
            <p v-if="!roomId" class="text-gray-600 mb-4">Нажми на кнопку, чтобы найти собеседника</p>
            <p v-else class="text-green-600 font-semibold">✅ Найден собеседник! Комната: {{ roomId }}</p>

            <button @click="findPartner" :disabled="isSearching" class="bg-blue-500 text-white px-4 py-2 rounded">
                {{ isSearching ? "Поиск..." : "Найти собеседника" }}
            </button>
            <button v-if="isSearching" @click="cancelSearch" class="bg-red-500 text-white px-4 py-2 rounded mt-2">
                Отменить поиск
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { io } from "socket.io-client";
import { useRouter } from "vue-router";

// Подключение к WebSocket
const router = useRouter();
const isSearching = ref(false);
const roomId = ref(null);

const socket = io('ws://localhost:5000');

socket.on('connect', () => {
    console.log('✅ Подключено к серверу! ID сокета:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('❌ Ошибка подключения:', error);
});


const findPartner = async () => {
    if (isSearching.value) return;

    isSearching.value = true;
    roomId.value = null;

    console.log(`🔍 Отправляю startSearch.. (ID сокета: ${socket.id})`);
    await socket.emit("startSearch");
};

socket.on("matchFound", (data) => {
    console.log("✅ Собеседник найден:", data);
    roomId.value = data.roomId;
    localStorage.setItem('roomId', String(roomId.value));
    isSearching.value = false;
    router.push(`/${roomId.value}`);
});


// Отмена поиска
const cancelSearch = () => {
    isSearching.value = false;
    socket.emit("cancelSearch");
};

// Если пользователь отменяет поиск — удаляем его из очереди на сервере
socket.on("searchCanceled", () => {
    console.log("❌ Поиск отменён");
    isSearching.value = false;
});
</script>
