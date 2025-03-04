<template>
  <div class="flex items-center justify-center h-screen bg-gradient-to-br from-red-400 to-purple-500">
    <div class="bg-white shadow-xl rounded-lg p-6 w-96 text-center">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">🔥 Чат-рулетка 🔥</h1>
      <p v-if="!roomId" class="text-gray-600 mb-4">Нажми на кнопку, чтобы найти собеседника</p>
      <p v-else class="text-green-600 font-semibold">✅ Найден собеседник! Комната: {{ roomId }}</p>

      <button @click="findPartner" :disabled="isSearching"
        class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-400">
        {{ isSearching ? "Поиск..." : "Найти собеседника" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";

// Подключение к WebSocket
const socket = io("http://localhost:3000");

const isSearching = ref(false);
const roomId = ref(null);

const findPartner = () => {
  if (isSearching.value) return;

  isSearching.value = true;
  roomId.value = null;

  // Отправляем запрос на поиск
  socket.emit("startSearch", { userId: "123" });

  // Когда найден собеседник
  socket.on("matchFound", (data) => {
    roomId.value = data.roomId;
    isSearching.value = false;
  });
};
</script>
