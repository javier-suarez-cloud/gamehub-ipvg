<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { pedirApi } from '../services/api'
import { usuario } from '../services/sesion'
import PartidoCard from '../components/PartidoCard.vue'

// Estado de la pantalla
const partidos = ref([])
const torneos = ref([])
const cargando = ref(true)
const error = ref('')
const exito = ref('')

// Búsqueda y filtros (v-model): texto por equipo, torneo y estado del partido
const buscar = ref('')
const torneoId = ref('')
const estado = ref('')

const esAdmin = computed(() => usuario.value?.rol === 'admin')

// computed: lista filtrada, se recalcula sola cuando cambia cualquier filtro
const partidosFiltrados = computed(() => {
  const texto = buscar.value.trim().toLowerCase()
  return partidos.value.filter((p) => {
    const coincideTexto =
      !texto ||
      p.equipoLocal.nombre.toLowerCase().includes(texto) ||
      p.equipoVisitante.nombre.toLowerCase().includes(texto)
    const coincideTorneo = !torneoId.value || p.torneo.id === Number(torneoId.value)
    const coincideEstado = !estado.value || p.estado === estado.value
    return coincideTexto && coincideTorneo && coincideEstado
  })
})

// Carga partidos y torneos (para el filtro) desde la API
async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    partidos.value = await pedirApi('/partidos')
    torneos.value = await pedirApi('/torneos')
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

// Elimina un partido (solo admin) después de confirmar
async function eliminar(partido) {
  if (!confirm(`¿Eliminar el partido ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}?`)) return
  error.value = ''
  exito.value = ''
  try {
    await pedirApi(`/partidos/${partido.id}`, { method: 'DELETE' })
    exito.value = 'Partido eliminado'
    await cargar()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(cargar)
</script>

<template>
  <section class="pagina">
    <div class="fila fila-separada">
      <h1>Partidos</h1>
      <!-- Solo el administrador programa partidos -->
      <RouterLink v-if="esAdmin" to="/partidos/nuevo" class="boton">Programar partido</RouterLink>
    </div>

    <form class="filtros" @submit.prevent>
      <input v-model="buscar" placeholder="Buscar por equipo" />
      <select v-model="torneoId">
        <option value="">Todos los torneos</option>
        <option v-for="t in torneos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
      </select>
      <select v-model="estado">
        <option value="">Todos los estados</option>
        <option value="programado">Programado</option>
        <option value="jugado">Jugado</option>
      </select>
    </form>

    <p v-if="exito" class="correcto">{{ exito }}</p>
    <p v-if="cargando" class="aviso">Cargando partidos...</p>

    <div v-else-if="error" class="error-api">
      <p>{{ error }}</p>
      <button @click="cargar">Reintentar</button>
    </div>

    <p v-else-if="partidosFiltrados.length === 0" class="aviso">No hay partidos para mostrar.</p>

    <div v-else class="grilla">
      <PartidoCard
        v-for="partido in partidosFiltrados"
        :key="partido.id"
        :partido="partido"
        :es-admin="esAdmin"
        @eliminar="eliminar"
      />
    </div>
  </section>
</template>
