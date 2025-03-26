// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/image"],
  runtimeConfig: {
    public: {
      apiBase: "http://localhost:5000", // Значение по умолчанию
    },
  },
});