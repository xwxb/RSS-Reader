// plugins/vuetify.js
import { defineNuxtPlugin } from '#app'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

export default defineNuxtPlugin(nuxtApp => {
    const vuetify = createVuetify({
        components,
        directives,
        ssr: true, 
        icons: {
            defaultSet: 'mdi',
            aliases,
            sets: {
                mdi,
            },
        }, 
})

nuxtApp.vueApp.use(vuetify)
})