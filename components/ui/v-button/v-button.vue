<template>
    <button :class="buttonClasses" :disabled="disabled">
        <slot></slot>
    </button>
</template>

<script setup lang="ts">
import type { ButtonProps } from "./button.types";
import { computed } from "vue";

const props = withDefaults(defineProps<ButtonProps>(), {
    variant: "primary",
    size: "md",
    disabled: false,
});

const buttonClasses = computed(() => {
    return [
        "rounded-lg font-medium transition-all m-1",
        props.size === "sm" ? "px-3 py-1 text-sm" :
            props.size === "lg" ? "px-6 py-3 text-lg" :
                "px-4 py-2", // Default: medium

        props.variant === "primary" ? "bg-blue-500 text-white hover:bg-blue-600" :
            props.variant === "secondary" ? "bg-gray-300 text-black hover:bg-gray-400" :
                "bg-red-500 text-white hover:bg-red-600", // Default: danger

        props.disabled ? "opacity-50 cursor-not-allowed" : ""
    ];
});
</script>