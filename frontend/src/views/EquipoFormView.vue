<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pedirApi } from '../services/api'
import { usuarioActual } from '../services/sesion'

const router = useRouter()
const hayUsuario = usuarioActual() !== null // crear un equipo requiere sesión

// Campos del formulario y mensaje de error
const nombre = ref('')
const juegoPreferido = ref('')
const error = ref('')
const enviando = ref(false)

// Envía el formulario: POST /equipos. El capitán es el usuario del token, no se envía
async function crearEquipo() {
  error.value = ''
  enviando.value = true
  try {
    const equipo = await pedirApi('/equipos', {
      method: 'POST',
      body: JSON.stringify({ nombre: nombre.value, juegoPreferido: juegoPreferido.value }),
    })
    router.push(`/equipos/${equipo.id}`) // al terminar, muestra el detalle del equipo nuevo
  } catch (e) {
    error.value = e.message // ej: "Ya existe un equipo con ese nombre"
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section>
    <h1>Nuevo equipo</h1>

    <p v-if="!hayUsuario" class="error">Debes iniciar sesión para crear un equipo.</p>

    <form v-else @submit.prevent="crearEquipo">
      <label for="nombre">Nombre del equipo</label>
      <input id="nombre" v-model="nombre" required />

      <label for="juego">Juego preferido</label>
      <input id="juego" v-model="juegoPreferido" required />

      <p v-if="error" class="error">{{ error }}</p>

      <div class="fila" style="margin-top: 16px">
        <button type="submit" :disabled="enviando">Crear equipo</button>
        <RouterLink to="/equipos">Cancelar</RouterLink>
      </div>
    </form>
  </section>
</template>
