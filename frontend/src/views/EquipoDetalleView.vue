<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pedirApi } from '../services/api'
import { usuarioActual } from '../services/sesion'

const route = useRoute()
const router = useRouter()
const id = route.params.id // viene de la URL /equipos/:id

const equipo = ref(null)
const cargando = ref(true)
const error = ref('')
const usuarioId = ref('') // id del jugador que se quiere sumar
const usuario = usuarioActual()

// Solo el capitán o un admin ven los botones de administración (la API lo vuelve a validar con 403)
const puedeAdministrar = computed(
  () => usuario && equipo.value && (usuario.id === equipo.value.capitan.id || usuario.rol === 'admin'),
)

// Carga el detalle: GET /equipos/:id (404 si no existe)
async function cargarEquipo() {
  try {
    equipo.value = await pedirApi(`/equipos/${id}`)
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

// Ejecuta una acción sobre el equipo y deja el equipo actualizado con la respuesta de la API
async function accion(ruta, opciones) {
  error.value = ''
  try {
    return await pedirApi(ruta, opciones)
  } catch (e) {
    error.value = e.message
    return null
  }
}

// PATCH /equipos/:id -> activa o desactiva el equipo
async function cambiarEstado() {
  const nuevoEstado = equipo.value.estado === 'activo' ? 'inactivo' : 'activo'
  const respuesta = await accion(`/equipos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado: nuevoEstado }),
  })
  if (respuesta) equipo.value = respuesta
}

// POST /equipos/:id/integrantes -> suma un jugador por su id
async function agregarIntegrante() {
  const respuesta = await accion(`/equipos/${id}/integrantes`, {
    method: 'POST',
    body: JSON.stringify({ usuarioId: Number(usuarioId.value) }),
  })
  if (respuesta) {
    equipo.value = respuesta
    usuarioId.value = ''
  }
}

// DELETE /equipos/:id/integrantes/:usuarioId -> quita un jugador
async function quitarIntegrante(idJugador) {
  const respuesta = await accion(`/equipos/${id}/integrantes/${idJugador}`, { method: 'DELETE' })
  if (respuesta) equipo.value = respuesta
}

// DELETE /equipos/:id -> elimina el equipo y vuelve al listado
async function eliminarEquipo() {
  if (!confirm('¿Seguro que quieres eliminar este equipo?')) return
  const respuesta = await accion(`/equipos/${id}`, { method: 'DELETE' })
  if (respuesta) router.push('/equipos')
}

onMounted(cargarEquipo)
</script>

<template>
  <section>
    <RouterLink to="/equipos">← Volver a equipos</RouterLink>

    <p v-if="cargando" class="aviso">Cargando equipo...</p>
    <p v-else-if="!equipo" class="error">{{ error }}</p>

    <template v-else>
      <div class="fila fila-separada">
        <h1>{{ equipo.nombre }}</h1>
        <span class="etiqueta" :class="equipo.estado">{{ equipo.estado }}</span>
      </div>
      <p>Juego preferido: {{ equipo.juegoPreferido }}</p>
      <p>Capitán: {{ equipo.capitan.nombre }} ({{ equipo.capitan.alias }})</p>

      <p v-if="error" class="error">{{ error }}</p>

      <h2>Integrantes</h2>
      <div v-for="jugador in equipo.integrantes" :key="jugador.id" class="tarjeta fila fila-separada">
        <span>
          {{ jugador.nombre }} ({{ jugador.alias }})
          <small v-if="jugador.id === equipo.capitan.id" class="aviso">· capitán</small>
        </span>
        <!-- El capitán no se puede quitar, por eso no tiene botón -->
        <button
          v-if="puedeAdministrar && jugador.id !== equipo.capitan.id"
          class="peligro"
          @click="quitarIntegrante(jugador.id)"
        >
          Quitar
        </button>
      </div>

      <!-- Administración: solo para el capitán o un admin -->
      <template v-if="puedeAdministrar">
        <form class="fila" @submit.prevent="agregarIntegrante">
          <input v-model="usuarioId" type="number" min="1" placeholder="Id del jugador" required />
          <button type="submit">Agregar integrante</button>
        </form>

        <div class="fila" style="margin-top: 16px">
          <button class="secundario" @click="cambiarEstado">
            {{ equipo.estado === 'activo' ? 'Desactivar equipo' : 'Activar equipo' }}
          </button>
          <button class="peligro" @click="eliminarEquipo">Eliminar equipo</button>
        </div>
      </template>
    </template>
  </section>
</template>
