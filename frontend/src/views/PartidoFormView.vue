<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { pedirApi } from '../services/api'

const router = useRouter()

// Campos del formulario (v-model)
const torneoId = ref('')
const equipoLocalId = ref('')
const equipoVisitanteId = ref('')
const fechaHora = ref('')
const ronda = ref('')

// Datos para los selects y estado de la pantalla
const torneos = ref([])
const inscripciones = ref([])
const error = ref('')
const enviando = ref(false)

// computed: solo los equipos inscritos y aceptados en el torneo elegido
const equiposDelTorneo = computed(() =>
  inscripciones.value.filter((i) => i.estado === 'aceptada').map((i) => i.equipo),
)
// computed: el visitante no puede ser el mismo equipo que el local, y al revés
const opcionesLocal = computed(() => equiposDelTorneo.value.filter((e) => e.id !== Number(equipoVisitanteId.value)))
const opcionesVisitante = computed(() => equiposDelTorneo.value.filter((e) => e.id !== Number(equipoLocalId.value)))

// Validación antes de enviar: devuelve el mensaje de error o '' si todo está bien
const problema = computed(() => {
  if (!torneoId.value) return 'Elige un torneo'
  if (!equipoLocalId.value || !equipoVisitanteId.value) return 'Elige el equipo local y el visitante'
  if (equipoLocalId.value === equipoVisitanteId.value) return 'Los equipos deben ser distintos'
  if (!fechaHora.value) return 'Indica la fecha y hora del partido'
  if (!ronda.value.trim()) return 'Indica la ronda (ej: Fecha 1, Semifinal, Final)'
  return ''
})

// Al cambiar de torneo se cargan sus equipos inscritos y se limpian los equipos elegidos
watch(torneoId, async (id) => {
  equipoLocalId.value = ''
  equipoVisitanteId.value = ''
  inscripciones.value = []
  if (!id) return
  try {
    inscripciones.value = await pedirApi(`/inscripciones?torneoId=${id}`)
  } catch (e) {
    error.value = e.message
  }
})

onMounted(async () => {
  try {
    torneos.value = await pedirApi('/torneos')
  } catch (e) {
    error.value = e.message
  }
})

// Envía el formulario: POST /partidos (solo admin; la API vuelve a validar las reglas)
async function programar() {
  error.value = ''
  if (problema.value) {
    error.value = problema.value
    return
  }
  enviando.value = true
  try {
    const partido = await pedirApi('/partidos', {
      method: 'POST',
      body: JSON.stringify({
        torneoId: Number(torneoId.value),
        equipoLocalId: Number(equipoLocalId.value),
        equipoVisitanteId: Number(equipoVisitanteId.value),
        fechaHora: fechaHora.value,
        ronda: ronda.value.trim(),
      }),
    })
    router.push(`/partidos/${partido.id}`)
  } catch (e) {
    error.value = e.message
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="pagina">
    <form class="formulario" @submit.prevent="programar">
      <h1>Programar partido</h1>

      <label for="torneo">Torneo</label>
      <select id="torneo" v-model="torneoId">
        <option value="">Elige un torneo</option>
        <option v-for="t in torneos" :key="t.id" :value="t.id">{{ t.nombre }} ({{ t.modalidad }})</option>
      </select>

      <!-- v-show: los selects de equipos se mantienen en el DOM pero ocultos hasta elegir torneo -->
      <div v-show="torneoId" class="formulario" style="border: 0; padding: 0; margin: 0">
        <p v-if="equiposDelTorneo.length < 2" class="aviso">
          Este torneo necesita al menos 2 equipos inscritos y aceptados.
        </p>

        <label for="local">Equipo local</label>
        <select id="local" v-model="equipoLocalId">
          <option value="">Elige el equipo local</option>
          <option v-for="e in opcionesLocal" :key="e.id" :value="e.id">{{ e.nombre }}</option>
        </select>

        <label for="visitante">Equipo visitante</label>
        <select id="visitante" v-model="equipoVisitanteId">
          <option value="">Elige el equipo visitante</option>
          <option v-for="e in opcionesVisitante" :key="e.id" :value="e.id">{{ e.nombre }}</option>
        </select>
      </div>

      <label for="fecha">Fecha y hora</label>
      <input id="fecha" v-model="fechaHora" type="datetime-local" />

      <label for="ronda">Ronda</label>
      <input id="ronda" v-model="ronda" placeholder="Fecha 1, Semifinal, Final..." />

      <p v-if="error" class="error">{{ error }}</p>

      <div class="fila">
        <button type="submit" :disabled="enviando">Programar partido</button>
        <RouterLink to="/partidos">Cancelar</RouterLink>
      </div>
    </form>
  </section>
</template>
