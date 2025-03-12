<template>
    <div class="bg-white p-4 flex items-center gap-3 shadow-md">
        <button @click="toggleEmojiPicker" class="text-xl text-black p-2 rounded-lg bg-blue-500 hover:bg-blue-600">
            <img src="@/public/icon/happy.svg" alt="Emoji" class="w-[22px] filter invert " />
        </button>
        <input v-model="newMessage" type="text" placeholder="Введите сообщение..."
            class="flex-1 p-2 border rounded-lg outline-none" @keydown.enter="sendMessage" />
        <button @click="sendMessage()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
            ➤ Отправить
        </button>
    </div>
    <EmojiPicker v-if="showEmojiPicker" @select="addEmoji" class="absolute bottom-16 left-4 shadow-lg" />
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

const newMessage = ref('');
const showEmojiPicker = ref(false);
const emit = defineEmits(['send-message']);

const sendMessage = () => {
    if (!newMessage.value.trim()) return;
    emit('send-message', newMessage.value);
    newMessage.value = '';
};

const addEmoji = (emoji: any) => {
    newMessage.value += emoji.i;
    showEmojiPicker.value = false;
};

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
};
</script>