<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { pedirApi } from '../services/api'

// Estado de la pantalla
const torneos = ref([])
const torneoId = ref('') // torneo elegido en el select (v-model)
const ranking = ref(null) // respuesta de GET /ranking?torneoId=
const cargando = ref(true)
const cargandoTabla = ref(false)
const error = ref('')

// computed: en una liga se muestran los empates; en eliminación no existen
const hayEmpates = computed(() => ranking.value?.torneo.modalidad === 'liga')
// computed: ningún equipo ha jugado todavía (todas las filas con 0 partidos)
const sinPartidos = computed(() => ranking.value?.tabla.every((f) => f.partidosJugados === 0))

// Pide la tabla de posiciones del torneo; la calcula la API con los resultados oficiales
async function cargarRanking(id) {
  ranking.value = null
  error.value = ''
  if (!id) return
  cargandoTabla.value = true
  try {
    ranking.value = await pedirApi(`/ranking?torneoId=${id}`)
  } catch (e) {
    error.value = e.message
  } finally {
    cargandoTabla.value = false
  }
}

// Cada vez que se cambia el torneo se vuelve a pedir la tabla
watch(torneoId, cargarRanking)

onMounted(async () => {
  try {
    torneos.value = await pedirApi('/torneos')
    // Si hay torneos, se muestra de inmediato el primero
    if (torneos.value.length > 0) torneoId.value = torneos.value[0].id
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <section class="pagina">
    <h1>Ranking</h1>

    <p v-if="cargando" class="aviso">Cargando torneos...</p>

    <div v-else-if="error && !ranking" class="error-api">
      <p>{{ error }}</p>
      <button @click="cargarRanking(torneoId)">Reintentar</button>
    </div>

    <p v-else-if="torneos.length === 0" class="aviso">Aún no hay torneos creados.</p>

    <template v-else>
      <form class="filtros" @submit.prevent>
        <select v-model="torneoId">
          <option v-for="t in torneos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
        </select>
      </form>

      <p v-if="cargandoTabla" class="aviso">Calculando tabla de posiciones...</p>

      <template v-else-if="ranking">
        <p class="aviso">
          {{ ranking.torneo.videojuego }} · {{ ranking.torneo.modalidad }} · Victoria
          {{ ranking.puntosVictoria }} pts<span v-if="hayEmpates">, empate {{ ranking.puntosEmpate }} pt</span>.
          La tabla se calcula con los resultados oficiales.
        </p>

        <p v-if="ranking.tabla.length === 0" class="aviso">Este torneo aún no tiene equipos inscritos.</p>

        <div v-else class="tabla-contenedor">
          <table class="tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Equipo</th>
                <th title="Partidos jugados">PJ</th>
                <th title="Victorias">G</th>
                <!-- v-show: la columna de empates solo aplica a ligas -->
                <th v-show="hayEmpates" title="Empates">E</th>
                <th title="Derrotas">P</th>
                <th title="Puntos a favor">PF</th>
                <th title="Puntos en contra">PC</th>
                <th title="Diferencia">DG</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in ranking.tabla" :key="fila.equipoId">
                <td>{{ fila.posicion }}</td>
                <td>
                  <RouterLink :to="`/equipos/${fila.equipoId}`">{{ fila.equipo }}</RouterLink>
                </td>
                <td>{{ fila.partidosJugados }}</td>
                <td>{{ fila.victorias }}</td>
                <td v-show="hayEmpates">{{ fila.empates }}</td>
                <td>{{ fila.derrotas }}</td>
                <td>{{ fila.golesFavor }}</td>
                <td>{{ fila.golesContra }}</td>
                <td>{{ fila.diferencia }}</td>
                <td>
                  <strong>{{ fila.puntos }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="sinPartidos && ranking.tabla.length > 0" class="aviso">
          Todavía no hay resultados registrados en este torneo.
        </p>
      </template>

      <p v-else-if="error" class="error">{{ error }}</p>
    </template>
  </section>
</template>
