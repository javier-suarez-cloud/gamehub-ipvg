import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // rutas de la SPA
import './style.css'

// Crea la app Vue, le agrega el router y la monta en el div #app del index.html
createApp(App)
  .use(router)
  .mount('#app')
