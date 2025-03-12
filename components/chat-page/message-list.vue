<template>
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-for="message in messages" :key="message.id" class="flex"
            :class="message.isMine ? 'justify-end' : 'justify-start'">
            <div class="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                <p>{{ message.message }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineProps, onMounted, nextTick } from 'vue';
import type { Message } from './types/chat.types';

const props = defineProps<{ messages: Message[] }>();
const chatContainer = ref<HTMLElement | null>(null);

onMounted(() => {
    scrollToBottom();
});

const scrollToBottom = () => {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTo({
                top: chatContainer.value.scrollHeight,
                behavior: 'smooth',
            });
        }
    });
};

defineExpose({ scrollToBottom });
</script>