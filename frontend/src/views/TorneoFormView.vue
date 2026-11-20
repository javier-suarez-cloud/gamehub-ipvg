<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pedirApi } from '../services/api'

const route = useRoute()
const router = useRouter()

// La misma vista sirve para crear (/torneos/nuevo) y editar (/torneos/:id/editar)
const id = route.params.id
const esEdicion = computed(() => Boolean(id))

// Campos del formulario
const torneo = ref({
  nombre: '',
  videojuego: '',
  modalidad: 'liga',
  fechaInicio: '',
  cierreInscripcion: '',
  cupoMaximo: 8,
  estado: 'abierto',
})
const error = ref('')
const guardando = ref(false)

// Al editar, carga los datos actuales del torneo
onMounted(async () => {
  if (!esEdicion.value) return
  try {
    const datos = await pedirApi(`/torneos/${id}`)
    const { nombre, videojuego, modalidad, fechaInicio, cierreInscripcion, cupoMaximo, estado } = datos
    torneo.value = { nombre, videojuego, modalidad, fechaInicio, cierreInscripcion, cupoMaximo, estado }
  } catch (e) {
    error.value = e.message
  }
})

// Validación antes de enviar (el backend vuelve a validar con el DTO)
function validar() {
  const t = torneo.value
  if (!t.nombre || !t.videojuego) return 'Nombre y videojuego son obligatorios'
  if (!t.fechaInicio || !t.cierreInscripcion) return 'Las dos fechas son obligatorias'
  if (t.cierreInscripcion > t.fechaInicio) return 'El cierre de inscripción no puede ser después del inicio'
  if (!Number.isInteger(t.cupoMaximo) || t.cupoMaximo < 2) return 'El cupo máximo debe ser al menos 2'
  return ''
}

// POST /torneos (crear) o PATCH /torneos/:id (editar)
async function guardar() {
  error.value = validar()
  if (error.value) return
  guardando.value = true
  try {
    const guardado = await pedirApi(esEdicion.value ? `/torneos/${id}` : '/torneos', {
      method: esEdicion.value ? 'PATCH' : 'POST',
      body: JSON.stringify(torneo.value),
    })
    router.push(`/torneos/${guardado.id}`)
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <section>
    <h1>{{ esEdicion ? 'Editar torneo' : 'Nuevo torneo' }}</h1>

    <form class="formulario" @submit.prevent="guardar" novalidate>
      <label for="nombre">Nombre</label>
      <input id="nombre" v-model.trim="torneo.nombre" />

      <label for="videojuego">Videojuego</label>
      <input id="videojuego" v-model.trim="torneo.videojuego" placeholder="Ej: FIFA, League of Legends" />

      <label for="modalidad">Modalidad</label>
      <select id="modalidad" v-model="torneo.modalidad">
        <option value="liga">Liga (permite empate)</option>
        <option value="eliminacion">Eliminación (siempre hay ganador)</option>
      </select>

      <label for="inicio">Fecha de inicio</label>
      <input id="inicio" v-model="torneo.fechaInicio" type="date" />

      <label for="cierre">Cierre de inscripción</label>
      <input id="cierre" v-model="torneo.cierreInscripcion" type="date" />

      <label for="cupo">Cupo máximo de equipos</label>
      <input id="cupo" v-model.number="torneo.cupoMaximo" type="number" min="2" />

      <!-- v-show: el campo existe siempre, pero solo se ve al editar -->
      <div v-show="esEdicion">
        <label for="estado">Estado</label>
        <select id="estado" v-model="torneo.estado">
          <option value="abierto">Abierto</option>
          <option value="en_curso">En curso</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="fila">
        <button type="submit" :disabled="guardando">{{ guardando ? 'Guardando...' : 'Guardar torneo' }}</button>
        <RouterLink to="/torneos">Cancelar</RouterLink>
      </div>
    </form>
  </section>
</template>
