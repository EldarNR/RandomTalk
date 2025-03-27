<template>
    <div class="container flex items-center justify-center min-h-screen">
        <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
            <vText size="xl">
                Login
            </vText>
            <div class="flex items-start justify-between mb-4 border rounded px-2 py-2">
                <vText size="lg" v-if="!changeUserName">{{ username }}</vText>
                <vAutoForm v-if="changeUserName" :form="registrationForm" class="" />

                <img v-if="changeUserName" src="@/assets/icon/close.svg"
                    class="w-6 h-6 rounded-full hover:bg-gray-200 cursor-pointer"
                    @click="() => (changeUserName = !changeUserName)" key="close" />
                <img v-else src="@/assets/icon/pencil.svg" alt="pencil icon"
                    class="w-6 h-6 rounded-full hover:bg-gray-200 cursor-pointer"
                    @click="() => (changeUserName = !changeUserName)" key="pencil" />
            </div>
            <vButton v-show="!changeUserName" @click="$emit('set', true)">
                Back
            </vButton>
        </div>
    </div>
</template>
<script setup lang="ts">
"use strict";

import vButton from "./ui/v-button/v-button.vue";
import vText from "./ui/v-text/v-text.vue";
import vAutoForm from "./ui/v-auto-form.vue/v-auto-form.vue";

import { type FormData } from "./ui/v-auto-form.vue/v-auto-form.types";
import { ref, onMounted } from "vue";

import { generateUserId } from "./func/generateUserId";

const username = ref<string>();
const changeUserName = ref<boolean>(false);

const registrationForm: FormData = {
    fields: [{ key: "username", type: "text", label: "Enter new user name", class: 'p-2 border border-blue-600' }],
    buttonText: 'Save',
    data: {
        username: "",
    },
};

onMounted(() => {
    if (typeof window !== "undefined") {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
            username.value = storedUsername;
            registrationForm.data.username = storedUsername;
        } else {
            username.value = `Guest-${generateUserId()}`;
            localStorage.setItem("username", username.value);
            registrationForm.data.username = username.value;
        }
    }
});
</script>