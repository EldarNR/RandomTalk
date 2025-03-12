<template>
    <div>
        <p>
            <vText size="xl">This LoginPage</vText>
        </p>
        <div>
            <vAutoForm :form="registrationForm" />
        </div>
        <vButton @click="$emit('set', true)">
            back
        </vButton>
    </div>
</template>

<script setup lang="ts">
import vButton from './ui/v-button/v-button.vue';
import vText from './ui/v-text/v-text.vue';
import vAutoForm from './ui/v-auto-form.vue/v-auto-form.vue';

import { type FormData } from './ui/v-auto-form.vue/v-auto-form.types';

const registrationForm: FormData = {
    fields: [
        { key: 'username', type: 'text', label: 'Имя пользователя' },
        { key: 'email', type: 'email', label: 'Email' },
        { key: 'password', type: 'password', label: 'Пароль' },
        { key: 'agree', type: 'checkbox', label: 'Согласен с условиями' },
    ],
    data: {
        username: '',
        email: '',
        password: '',
        agree: false,
    },
};

const loginForm: FormData = {
    fields: [
        { key: 'email', type: 'email', label: 'Email' },
        { key: 'password', type: 'password', label: 'Пароль' },
    ],
    data: {
        email: '',
        password: '',
    },
};
</script>
