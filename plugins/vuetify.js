// plugins/vuetify.js
import { defineNuxtPlugin } from '#app'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'

export default defineNuxtPlugin(nuxtApp => {
    const vuetify = createVuetify({
        components,
        directives,
        ssr: true
})

nuxtApp.vueApp.use(vuetify)
})