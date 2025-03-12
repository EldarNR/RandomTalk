<template>
    <div :class="alertClasses">
        <div v-if="title" class="font-semibold mb-2">{{ title }}</div>
        <div>{{ message }}</div>
        <button v-if="closable" @click="closeAlert" class="absolute top-2 right-2">
            <img src="@/assets/icon/evenood.svg" alt="evenood">
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AlertProps, AlertEmits } from './alert.types.js';

const props = withDefaults(defineProps<AlertProps>(), {
    variant: 'info',
    title: undefined,
    closable: false,
});

const emit = defineEmits<AlertEmits>();

const alertClasses = computed(() => {
    return [
        'relative p-4 rounded-md',
        props.variant === 'success' ? 'bg-green-100 text-green-700' :
            props.variant === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                props.variant === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700',
    ];
});

const closeAlert = () => {
    emit('close');
};
</script>