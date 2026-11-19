<script setup>
import { ref, onMounted } from 'vue'
import { pedirApi } from '../services/api'

// Datos del perfil y estados de la pantalla
const perfil = ref(null)
const nombre = ref('')
const alias = ref('')
const cargando = ref(true)
const error = ref('')
const exito = ref('')

// GET /auth/perfil (ruta protegida: el servicio api.js envía el token)
async function cargarPerfil() {
  try {
    perfil.value = await pedirApi('/auth/perfil')
    nombre.value = perfil.value.nombre
    alias.value = perfil.value.alias
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

// PATCH /auth/perfil -> guarda nombre y alias
async function guardar() {
  error.value = ''
  exito.value = ''
  if (!nombre.value || !alias.value) {
    error.value = 'Nombre y alias no pueden quedar vacíos'
    return
  }
  try {
    perfil.value = await pedirApi('/auth/perfil', {
      method: 'PATCH',
      body: JSON.stringify({ nombre: nombre.value, alias: alias.value }),
    })
    exito.value = 'Perfil actualizado'
  } catch (e) {
    error.value = e.message
  }
}

onMounted(cargarPerfil)
</script>

<template>
  <section>
    <h1>Mi perfil</h1>

    <p v-if="cargando" class="aviso">Cargando perfil...</p>
    <p v-else-if="!perfil" class="error-api">{{ error }}</p>

    <form v-else class="formulario" @submit.prevent="guardar">
      <p class="aviso">{{ perfil.correo }} · rol: {{ perfil.rol }}</p>

      <label for="nombre">Nombre</label>
      <input id="nombre" v-model.trim="nombre" />

      <label for="alias">Alias de jugador</label>
      <input id="alias" v-model.trim="alias" />

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="exito" class="correcto">{{ exito }}</p>

      <button type="submit">Guardar cambios</button>
    </form>
  </section>
</template>

