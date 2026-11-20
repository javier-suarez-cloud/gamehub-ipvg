<script setup>
import { ref, computed, onMounted } from 'vue'
import { pedirApi } from '../services/api'
import { usuario } from '../services/sesion'
import TorneoCard from '../components/TorneoCard.vue'

// Estado de la pantalla
const torneos = ref([])
const cargando = ref(true)
const error = ref('')
const exito = ref('')

// Búsqueda y filtros (v-model): se pueden combinar entre sí
const buscar = ref('')
const videojuego = ref('')
const estado = ref('')
const modalidad = ref('')

// computed: solo el administrador ve los botones de crear y eliminar
const esAdmin = computed(() => usuario.value?.rol === 'admin')

// computed: lista de videojuegos sin repetir, para llenar el filtro
const videojuegos = computed(() => [...new Set(torneos.value.map((t) => t.videojuego))])

// computed: torneos que cumplen TODOS los filtros elegidos (se recalcula al cambiar cualquiera)
const torneosFiltrados = computed(() =>
  torneos.value.filter(
    (t) =>
      t.nombre.toLowerCase().includes(buscar.value.toLowerCase()) &&
      (!videojuego.value || t.videojuego === videojuego.value) &&
      (!estado.value || t.estado === estado.value) &&
      (!modalidad.value || t.modalidad === modalidad.value),
  ),
)

// GET /torneos
async function cargarTorneos() {
  cargando.value = true
  error.value = ''
  try {
    torneos.value = await pedirApi('/torneos')
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

// Responde al evento "eliminar" que emite TorneoCard: confirma y llama a DELETE /torneos/:id
async function eliminarTorneo(torneo) {
  if (!confirm(`¿Eliminar el torneo "${torneo.nombre}"? También se borran sus inscripciones.`)) return
  try {
    await pedirApi(`/torneos/${torneo.id}`, { method: 'DELETE' })
    exito.value = `Torneo "${torneo.nombre}" eliminado`
    await cargarTorneos()
  } catch (e) {
    error.value = e.message
  }
}

function limpiarFiltros() {
  buscar.value = ''
  videojuego.value = ''
  estado.value = ''
  modalidad.value = ''
}

onMounted(cargarTorneos)
</script>

<template>
  <section>
    <div class="fila fila-separada">
      <h1>Torneos</h1>
      <RouterLink v-if="esAdmin" to="/torneos/nuevo" class="boton">Nuevo torneo</RouterLink>
    </div>

    <!-- Búsqueda por texto + 3 filtros combinables -->
    <div class="filtros">
      <input v-model="buscar" placeholder="Buscar por nombre" />
      <select v-model="videojuego">
        <option value="">Todos los videojuegos</option>
        <option v-for="juego in videojuegos" :key="juego" :value="juego">{{ juego }}</option>
      </select>
      <select v-model="estado">
        <option value="">Todos los estados</option>
        <option value="abierto">Abierto</option>
        <option value="en_curso">En curso</option>
        <option value="finalizado">Finalizado</option>
      </select>
      <select v-model="modalidad">
        <option value="">Todas las modalidades</option>
        <option value="liga">Liga</option>
        <option value="eliminacion">Eliminación</option>
      </select>
      <button class="secundario" @click="limpiarFiltros">Limpiar</button>
    </div>

    <p v-if="exito" class="correcto">{{ exito }}</p>

    <p v-if="cargando" class="aviso">Cargando torneos...</p>

    <!-- Error de comunicación con la API (diseño de la Actividad 13) -->
    <div v-else-if="error" class="error-api">
      <p>{{ error }}</p>
      <button @click="cargarTorneos">Reintentar</button>
    </div>

    <p v-else-if="torneosFiltrados.length === 0" class="aviso">
      No hay torneos que coincidan con la búsqueda.
    </p>

    <!-- Componente reutilizable: le pasamos datos por props y escuchamos su evento "eliminar" -->
    <div v-else class="grilla">
      <TorneoCard
        v-for="torneo in torneosFiltrados"
        :key="torneo.id"
        :torneo="torneo"
        :es-admin="esAdmin"
        @eliminar="eliminarTorneo"
      />
    </div>
  </section>
</template>
