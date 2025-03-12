<template>
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
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { User } from './types/chat.types.js';

const props = defineProps<{ user: User }>();
const emit = defineEmits(['disconnect']);

const disconnect = () => {
    emit('disconnect');
};
</script>