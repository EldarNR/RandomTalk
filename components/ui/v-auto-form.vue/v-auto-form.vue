<template>
    <form @submit.prevent="handleSubmit">
        <div v-for="field in form.fields" :key="field.key">
            <label :for="field.key">{{ field.label }}</label>
            <input :type="field.type" :id="field.key" v-model="form.data[field.key]" />
        </div>
        <button type="submit">Отправить</button>
    </form>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import type { FormData } from './v-auto-form.types';

const props = defineProps<{ form: FormData }>();
const form = ref(props.form);

const handleSubmit = () => {
    console.log(form.value.data);
};
</script>