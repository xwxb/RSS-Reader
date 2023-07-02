// https://nuxt.com/docs/api/configuration/nuxt-config

// https://v3.nuxtjs.org/api/configuration/nuxt.config


export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      parseAPI: process.env.PARSE_API_URL,
    }
  },
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
  ],
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
  },
  typescript: {
    shim: false
  }
})
