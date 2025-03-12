<template>
    <div class="flex items-center justify-center h-screen bg-gradient-to-br from-red-400 to-purple-500">
        <Search @set="(val: boolean) => isLogin = val" v-if="isLogin" />
        <Login @set="(val: boolean) => isLogin = val" v-else />
    </div>
</template>

<script setup lang="ts">


import Login from "~/components/Login.vue";
import Search from "~/components/Search.vue";

const isLogin = ref(false);

</script>
