<template>
    <div v-if="props.user" class="flex items-center justify-between p-4 bg-white shadow-md">
        <div class="flex items-center">
            <img :src="!props.user.avatar ? 'https://i.pravatar.cc/300' : user.avatar" alt="User Avatar"
                class="w-10 h-10 rounded-full mr-4" />
            <div>
                <h2 class="text-lg font-semibold">{{ props.user.username
                }}</h2>
                <p class="text-sm text-gray-500">
                    {{ props.user.status }}
                </p>
            </div>
        </div>
        <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" @click="disconnect">
            Disconnect
        </button>
    </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { User } from './types/chat.types';
const props = defineProps<{
    user: User;
}>();
const emit = defineEmits(['disconnect']);
function disconnect() {
    emit('disconnect');
}
</script>