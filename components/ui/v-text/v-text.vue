<template>
    <span fallback-tag="p" :class="textClasses">
        <slot></slot>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type TextProps } from './v-text.types';

const props = withDefaults(defineProps<TextProps>(), {
    size: 'md',
    weight: 'normal',
});

const textClasses = computed(() => {
    return [
        props.size === 'sm' ? 'text-sm' :
            props.size === 'lg' ? 'text-lg' :
                props.size === 'xl' ? 'text-xl' :
                    'text-base',

        props.weight === 'medium' ? 'font-medium' :
            props.weight === 'semibold' ? 'font-semibold' :
                props.weight === 'bold' ? 'font-bold' :
                    'font-normal',
    ];
});
</script>