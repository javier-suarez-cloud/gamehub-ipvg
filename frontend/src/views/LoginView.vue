<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pedirApi } from '../services/api'
import { iniciarSesion } from '../services/sesion'

const route = useRoute()
const router = useRouter()

// Campos del formulario (v-model) y estados de la pantalla
const correo = ref('')
const password = ref('')
const error = ref('')
const enviando = ref(false)

// Valida antes de enviar: así no se llama a la API con datos que sabemos que están mal
function validar() {
  if (!/^\S+@\S+\.\S+$/.test(correo.value)) return 'Escribe un correo válido'
  if (!password.value) return 'Escribe tu contraseña'
  return ''
}

// POST /auth/login -> guarda el token y vuelve a la página que se quería abrir
async function ingresar() {
  error.value = validar()
  if (error.value) return
  enviando.value = true
  try {
    const respuesta = await pedirApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo: correo.value, password: password.value }),
    })
    iniciarSesion(respuesta.token)
    router.push(route.query.volver || '/') // "volver" lo pone la guardia del router
  } catch (e) {
    error.value = e.message // ej: "Correo o contraseña incorrectos"
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section>
    <h1>Ingresar</h1>
    <p v-if="route.query.volver" class="aviso">Debes iniciar sesión para continuar.</p>

    <form class="formulario" @submit.prevent="ingresar" novalidate>
      <label for="correo">Correo</label>
      <input id="correo" v-model.trim="correo" type="email" autocomplete="username" />

      <label for="password">Contraseña</label>
      <input id="password" v-model="password" type="password" autocomplete="current-password" />

      <p v-if="error" class="error">{{ error }}</p>

      <div class="fila">
        <button type="submit" :disabled="enviando">{{ enviando ? 'Ingresando...' : 'Ingresar' }}</button>
        <RouterLink to="/registro">¿No tienes cuenta? Regístrate</RouterLink>
      </div>
    </form>
  </section>
</template>

