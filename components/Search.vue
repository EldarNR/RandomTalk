<template>
    <div class="bg-white shadow-xl rounded-lg p-6 w-96 text-center">
        <vText :size="'xl'"> Чат-рулетка </vText>
        <p v-if="!roomId">
            <vText>Нажми на кнопку, чтобы найти собеседника</vText>
        </p>
        <p v-else>
            <vText>✅ Найден собеседник! Комната: {{ roomId }}</vText>
        </p>
        <vButton @click="$emit('set', false)">
            <vText>{{ username }}</vText>
        </vButton>
        <vButton @click="findPartner" :disabled="isSearching">
            <vText> {{ isSearching ? "Поиск..." : "Найти собеседника" }}</vText>
        </vButton>
        <vButton v-if="isSearching" @click="cancelSearch">
            <vText>Отменить поиск</vText>
        </vButton>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { io } from "socket.io-client";

import vButton from "./ui/v-button/v-button.vue";
import vText from "./ui/v-text/v-text.vue";

import { generateUserId } from "./func/generateUserId";

import { __URL_API } from '~/server/API';

const isSearching = ref(false);
const roomId = ref(null);
let userId = ref<string>(localStorage.getItem("userId") || generateUserId());

if (userId.value && !localStorage.getItem("userId")) {
    localStorage.setItem("userId", userId.value);
}

const username = ref<string>(localStorage.getItem("username") || "Guest - " + generateUserId()); // Добавляем значение по умолчанию
const socket = io(__URL_API, {
    query: {
        userId: userId.value,
        username: username.value, // Используем значение по умолчанию
    },
});

socket.on("searchFailed", (data) => {
    console.error("❌ Ошибка поиска:", data.message);
    isSearching.value = false;
    // Отобразите сообщение об ошибке пользователю
});

socket.on("disconnect", () => {
    console.error("❌ Соединение с сервером потеряно");
    isSearching.value = false;
    // Отобразите сообщение об ошибке пользователю
});

socket.on("connect", () => {
    console.log("✅ Подключено к серверу! ID сокета:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("❌ Ошибка подключения:", error);
});

const findPartner = async () => {
    if (isSearching.value) return;
    if (!socket.connected) {
        console.error("❌ Соединение не установлено");
        return;
    }

    isSearching.value = true;
    roomId.value = null;

    console.log(` Отправляю startSearch.. (ID сокета: ${socket.id})`);
    socket.emit("startSearch");
};

socket.on("matchFound", (data) => {
    roomId.value = data.roomId;
    localStorage.setItem("roomId", String(roomId.value));
    isSearching.value = false;
    navigateTo(`/${roomId.value}`);
});

const cancelSearch = () => {
    isSearching.value = false;
    socket.emit("cancelSearch");
};

socket.on("searchCanceled", () => {
    console.log("❌ Поиск отменён");
    isSearching.value = false;
});
</script>