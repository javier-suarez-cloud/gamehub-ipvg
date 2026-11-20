<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pedirApi } from '../services/api'
import { usuario } from '../services/sesion'
import { formatearFechaHora } from '../services/formato'

const route = useRoute()
const router = useRouter()
const id = route.params.id // viene de la URL /partidos/:id

// Estado de la pantalla
const partido = ref(null)
const cargando = ref(true)
const error = ref('')
const exito = ref('')

// Formulario del resultado (v-model)
const puntajeLocal = ref('')
const puntajeVisitante = ref('')
const editando = ref(false) // true cuando el admin corrige un resultado ya registrado

const esAdmin = computed(() => usuario.value?.rol === 'admin')

// computed: el formulario del resultado se muestra si no hay resultado o si se está corrigiendo
const mostrarFormulario = computed(
  () => esAdmin.value && partido.value && (!partido.value.resultado || editando.value),
)

// Validación antes de enviar: devuelve el mensaje o '' si todo está bien
const problema = computed(() => {
  const local = Number(puntajeLocal.value)
  const visitante = Number(puntajeVisitante.value)
  if (puntajeLocal.value === '' || puntajeVisitante.value === '') return 'Escribe los dos puntajes'
  if (!Number.isInteger(local) || !Number.isInteger(visitante)) return 'Los puntajes deben ser números enteros'
  if (local < 0 || visitante < 0) return 'Los puntajes no pueden ser negativos'
  // Mismo criterio de la API: en eliminación siempre debe haber ganador
  if (local === visitante && partido.value?.torneo.modalidad === 'eliminacion') {
    return 'En un torneo de eliminación no puede haber empate'
  }
  return ''
})

// computed: texto con el resultado final (ganador o empate)
const textoGanador = computed(() => {
  const r = partido.value?.resultado
  if (!r) return ''
  return r.ganador ? `Ganador: ${r.ganador.nombre}` : 'Empate'
})

// Carga el partido: GET /partidos/:id (404 si no existe)
async function cargar() {
  try {
    partido.value = await pedirApi(`/partidos/${id}`)
  } catch (e) {
    error.value = e.message // ej: "No existe el partido con id 99"
  } finally {
    cargando.value = false
  }
}

// Registra o corrige el resultado oficial (solo admin). El ganador lo calcula la API
async function guardarResultado() {
  error.value = ''
  exito.value = ''
  if (problema.value) {
    error.value = problema.value
    return
  }
  const cuerpo = { puntajeLocal: Number(puntajeLocal.value), puntajeVisitante: Number(puntajeVisitante.value) }
  try {
    if (editando.value) {
      await pedirApi(`/resultados/${partido.value.resultado.id}`, { method: 'PATCH', body: JSON.stringify(cuerpo) })
      exito.value = 'Resultado corregido; el ranking se actualizó'
    } else {
      await pedirApi('/resultados', { method: 'POST', body: JSON.stringify({ partidoId: Number(id), ...cuerpo }) })
      exito.value = 'Resultado registrado; el ranking se actualizó'
    }
    editando.value = false
    await cargar()
  } catch (e) {
    error.value = e.message
  }
}

// Prepara el formulario con los puntajes actuales para corregirlos
function corregir() {
  puntajeLocal.value = partido.value.resultado.puntajeLocal
  puntajeVisitante.value = partido.value.resultado.puntajeVisitante
  editando.value = true
}

// Anula el resultado (el partido vuelve a "programado") después de confirmar
async function anularResultado() {
  if (!confirm('¿Anular el resultado? El partido volverá a quedar programado.')) return
  error.value = ''
  exito.value = ''
  try {
    await pedirApi(`/resultados/${partido.value.resultado.id}`, { method: 'DELETE' })
    exito.value = 'Resultado anulado'
    puntajeLocal.value = ''
    puntajeVisitante.value = ''
    await cargar()
  } catch (e) {
    error.value = e.message
  }
}

// Elimina el partido y vuelve al listado, después de confirmar
async function eliminarPartido() {
  if (!confirm('¿Seguro que quieres eliminar este partido?')) return
  error.value = ''
  try {
    await pedirApi(`/partidos/${id}`, { method: 'DELETE' })
    router.push('/partidos')
  } catch (e) {
    error.value = e.message
  }
}

onMounted(cargar)
</script>

<template>
  <section class="pagina">
    <RouterLink to="/partidos">← Volver a partidos</RouterLink>

    <p v-if="cargando" class="aviso">Cargando partido...</p>

    <div v-else-if="!partido" class="error-api">
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <div class="tarjeta">
        <div class="fila fila-separada">
          <h1>{{ partido.equipoLocal.nombre }} vs {{ partido.equipoVisitante.nombre }}</h1>
          <span class="etiqueta" :class="partido.estado === 'jugado' ? '' : 'inactivo'">{{ partido.estado }}</span>
        </div>
        <p>
          Torneo:
          <RouterLink :to="`/torneos/${partido.torneo.id}`">{{ partido.torneo.nombre }}</RouterLink>
          ({{ partido.torneo.modalidad }})
        </p>
        <p>Ronda: {{ partido.ronda }}</p>
        <p>Fecha y hora: {{ formatearFechaHora(partido.fechaHora) }}</p>

        <!-- v-if / v-else: resultado oficial o aviso de que aún no se juega -->
        <div v-if="partido.resultado">
          <h2 class="marcador-grande">
            {{ partido.resultado.puntajeLocal }} - {{ partido.resultado.puntajeVisitante }}
          </h2>
          <p>
            <strong>{{ textoGanador }}</strong>
          </p>
        </div>
        <p v-else class="aviso">Este partido aún no tiene resultado oficial.</p>
      </div>

      <p v-if="exito" class="correcto">{{ exito }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <!-- Solo el administrador registra, corrige o anula resultados -->
      <form v-if="mostrarFormulario" class="formulario" @submit.prevent="guardarResultado">
        <h2>{{ editando ? 'Corregir resultado' : 'Registrar resultado oficial' }}</h2>

        <label for="local">Puntaje de {{ partido.equipoLocal.nombre }}</label>
        <input id="local" v-model="puntajeLocal" type="number" min="0" />

        <label for="visitante">Puntaje de {{ partido.equipoVisitante.nombre }}</label>
        <input id="visitante" v-model="puntajeVisitante" type="number" min="0" />

        <p class="aviso">El ganador (o el empate) se calcula con los puntajes.</p>

        <div class="fila">
          <button type="submit">{{ editando ? 'Guardar corrección' : 'Registrar resultado' }}</button>
          <button v-if="editando" type="button" class="secundario" @click="editando = false">Cancelar</button>
        </div>
      </form>

      <div v-if="esAdmin" class="fila">
        <button v-if="partido.resultado && !editando" class="secundario" @click="corregir">Corregir resultado</button>
        <button v-if="partido.resultado" class="secundario" @click="anularResultado">Anular resultado</button>
        <button class="peligro" @click="eliminarPartido">Eliminar partido</button>
      </div>
    </template>
  </section>
</template>
