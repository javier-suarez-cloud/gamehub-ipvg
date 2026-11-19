<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { pedirApi } from '../services/api'
import { usuarioActual } from '../services/sesion'

// Datos de la pantalla: lista de equipos, texto de búsqueda y estado de carga/error
const equipos = ref([])
const buscar = ref('')
const cargando = ref(true)
const error = ref('')
const hayUsuario = usuarioActual() !== null // el botón "Nuevo equipo" solo sale con sesión

// Pide los equipos a la API (GET /equipos?buscar=texto)
async function cargarEquipos() {
  cargando.value = true
  error.value = ''
  try {
    const consulta = buscar.value ? `?buscar=${encodeURIComponent(buscar.value)}` : ''
    equipos.value = await pedirApi(`/equipos${consulta}`)
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

// Al abrir la vista se carga el listado completo
onMounted(cargarEquipos)
</script>

<template>
  <section>
    <div class="fila fila-separada">
      <h1>Equipos</h1>
      <RouterLink v-if="hayUsuario" to="/equipos/nuevo" class="boton">Nuevo equipo</RouterLink>
    </div>

    <!-- Búsqueda por nombre: al enviar el formulario se vuelve a pedir la lista -->
    <form class="filtros" @submit.prevent="cargarEquipos">
      <input v-model="buscar" placeholder="Buscar por nombre" />
      <button type="submit">Buscar</button>
    </form>

    <p v-if="cargando" class="aviso">Cargando equipos...</p>

    <!-- Error de comunicación con la API (diseño de la Actividad 13) -->
    <div v-else-if="error" class="error-api">
      <p>{{ error }}</p>
      <button @click="cargarEquipos">Reintentar</button>
    </div>

    <p v-else-if="equipos.length === 0" class="aviso">No hay equipos para mostrar.</p>

    <!-- Una tarjeta por equipo en grilla; el enlace lleva al detalle /equipos/:id -->
    <div v-else class="grilla">
      <div v-for="equipo in equipos" :key="equipo.id" class="tarjeta">
        <div class="fila fila-separada">
          <RouterLink :to="`/equipos/${equipo.id}`"><strong>{{ equipo.nombre }}</strong></RouterLink>
          <span class="etiqueta" :class="equipo.estado">{{ equipo.estado }}</span>
        </div>
        <p class="aviso">
          {{ equipo.juegoPreferido }} · Capitán: {{ equipo.capitan.alias }} ·
          {{ equipo.integrantes.length }} integrante(s)
        </p>
      </div>
    </div>
  </section>
</template>
