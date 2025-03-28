<template>
    <div v-if="error"
        class="fixed left-[45%] right-[45%] top-8 w-[250px] bg-white border border-red-300 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
        role="alert">
        <div class="flex items-center justify-between p-4 bg-red-50 border-b border-red-200">
            <div class="flex items-center">
                <h3 class="font-semibold text-red-700">Error</h3>
            </div>
            <button @click="closeError"
                class="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-100">
                <span class="material-symbols-outlined text-xl"><img src="@/assets/icon/close.svg" class="w-4 h-4"
                        alt="close"></span>
            </button>
        </div>
        <div class="p-5">
            <p class="text-gray-600 mb-4">
                {{ errorMessage }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import emitter from './func/mitt';

const error = ref<boolean>(false);
const errorMessage = ref<string>();
let timer: NodeJS.Timeout | number | null = null;

function closeError() {
    error.value = false;
    errorMessage.value = '';
    if (timer) {
        clearTimeout(timer);
    }
}

function showError(statusMessage: any): void {
    errorMessage.value = statusMessage;
    error.value = true;
    if (timer) {
        clearTimeout(timer);
    }

}
emitter.on('show-error', showError);
emitter.off('show-error', showError);
</script>