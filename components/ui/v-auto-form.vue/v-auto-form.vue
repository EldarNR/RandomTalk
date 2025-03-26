<template>
    <form @submit="handleSubmit">
        <div v-for="field in form.fields" :key="field.key">
            <label :for="field.key" >{{ field.label }}</label>
            <input :type="field.type" :id="field.key" v-model="form.data[field.key]" :class="field.class" />
        </div>
        <vButton type="submit">{{ form.buttonText }}</vButton>
    </form>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";
import type { FormData } from "./v-auto-form.types";
import vButton from "../v-button/v-button.vue";

const props = defineProps<{ form: FormData }>();
const form = reactive(props.form);

const handleSubmit = (): void => {
    localStorage.setItem("username", String(form.data.username));
};
</script>