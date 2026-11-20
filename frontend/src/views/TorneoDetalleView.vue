<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pedirApi } from '../services/api'
import { usuario } from '../services/sesion'

const route = useRoute()
const router = useRouter()
const id = route.params.id // viene de la URL /torneos/:id

// Estado de la pantalla
const torneo = ref(null)
const inscripciones = ref([])
const misEquipos = ref([])
const equipoElegido = ref('')
const cargando = ref(true)
const error = ref('')
const exito = ref('')

const esAdmin = computed(() => usuario.value?.rol === 'admin')

// computed: cuántos cupos quedan (solo cuentan las inscripciones aceptadas)
const aceptadas = computed(() => inscripciones.value.filter((i) => i.estado === 'aceptada').length)
const cuposLibres = computed(() => (torneo.value ? torneo.value.cupoMaximo - aceptadas.value : 0))

// computed: el período de inscripción sigue abierto (misma regla que el backend)
const inscripcionAbierta = computed(() => {
  if (!torneo.value) return false
  const hoy = new Date().toLocaleDateString('sv-SE') // AAAA-MM-DD
  return torneo.value.estado === 'abierto' && hoy <= torneo.value.cierreInscripcion
})

// Carga torneo, inscripciones y (si hay sesión) los equipos que el usuario puede inscribir
async function cargar() {
  error.value = ''
  try {
    torneo.value = await pedirApi(`/torneos/${id}`)
    inscripciones.value = await pedirApi(`/inscripciones?torneoId=${id}`)
    if (usuario.value) {
      const equipos = await pedirApi('/equipos')
      // El capitán solo ve sus equipos; el admin puede inscribir cualquiera
      misEquipos.value = equipos.filter(
        (e) => esAdmin.value || e.capitan.id === usuario.value.id,
      )
    }
  } catch (e) {
    error.value = e.message // ej: "No existe el torneo con id 99"
  } finally {
    cargando.value = false
  }
}

// Ejecuta una acción y recarga la pantalla mostrando éxito o error
async function accion(ruta, opciones, mensaje) {
  error.value = ''
  exito.value = ''
  try {
    await pedirApi(ruta, opciones)
    exito.value = mensaje
    await cargar()
  } catch (e) {
    error.value = e.message // ej: "El torneo ya completó su cupo máximo"
  }
}

// POST /inscripciones
function inscribir() {
  if (!equipoElegido.value) {
    error.value = 'Elige un equipo para inscribir'
    return
  }
  accion(
    '/inscripciones',
    { method: 'POST', body: JSON.stringify({ torneoId: Number(id), equipoId: Number(equipoElegido.value) }) },
    'Equipo inscrito',
  )
  equipoElegido.value = ''
}

// PATCH /inscripciones/:id (solo admin)
function cambiarEstado(inscripcion, estado) {
  accion(`/inscripciones/${inscripcion.id}`, { method: 'PATCH', body: JSON.stringify({ estado }) }, `Inscripción ${estado}`)
}

// DELETE /inscripciones/:id (capitán del equipo o admin)
function cancelar(inscripcion) {
  if (!confirm(`¿Cancelar la inscripción de ${inscripcion.equipo.nombre}?`)) return
  accion(`/inscripciones/${inscripcion.id}`, { method: 'DELETE' }, 'Inscripción cancelada')
}

// Puede cancelar el capitán de ese equipo o un admin
function puedeCancelar(inscripcion) {
  return usuario.value && (esAdmin.value || inscripcion.equipo.capitan.id === usuario.value.id)
}

// DELETE /torneos/:id (solo admin)
async function eliminarTorneo() {
  if (!confirm('¿Eliminar este torneo? También se borran sus inscripciones.')) return
  try {
    await pedirApi(`/torneos/${id}`, { method: 'DELETE' })
    router.push('/torneos')
  } catch (e) {
    error.value = e.message
  }
}

onMounted(cargar)
</script>

<template>
  <section>
    <RouterLink to="/torneos">← Volver a torneos</RouterLink>

    <p v-if="cargando" class="aviso">Cargando torneo...</p>
    <div v-else-if="!torneo" class="error-api">
      <p>{{ error }}</p>
      <RouterLink to="/torneos">Ir al listado</RouterLink>
    </div>

    <template v-else>
      <div class="fila fila-separada">
        <h1>{{ torneo.nombre }}</h1>
        <span class="etiqueta" :class="torneo.estado">{{ torneo.estado }}</span>
      </div>

      <div class="tarjeta">
        <p><strong>Videojuego:</strong> {{ torneo.videojuego }} · <strong>Modalidad:</strong> {{ torneo.modalidad }}</p>
        <p><strong>Inicio:</strong> {{ torneo.fechaInicio }} · <strong>Cierre de inscripción:</strong> {{ torneo.cierreInscripcion }}</p>
        <p><strong>Cupos:</strong> {{ aceptadas }} de {{ torneo.cupoMaximo }} ocupados ({{ cuposLibres }} libres)</p>
        <div v-if="esAdmin" class="fila">
          <RouterLink :to="`/torneos/${torneo.id}/editar`" class="boton">Editar torneo</RouterLink>
          <button class="peligro" @click="eliminarTorneo">Eliminar torneo</button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="exito" class="correcto">{{ exito }}</p>

      <!-- Inscribir un equipo: solo con sesión y con el período abierto -->
      <form v-if="usuario && inscripcionAbierta" class="formulario" @submit.prevent="inscribir">
        <h2>Inscribir equipo</h2>
        <p v-if="misEquipos.length === 0" class="aviso">
          No eres capitán de ningún equipo. <RouterLink to="/equipos/nuevo">Crea uno</RouterLink>.
        </p>
        <template v-else>
          <select v-model="equipoElegido">
            <option value="">Elige un equipo</option>
            <option v-for="equipo in misEquipos" :key="equipo.id" :value="equipo.id">{{ equipo.nombre }}</option>
          </select>
          <button type="submit">Inscribir</button>
        </template>
      </form>
      <p v-else-if="!inscripcionAbierta" class="aviso">Las inscripciones de este torneo están cerradas.</p>
      <p v-else class="aviso"><RouterLink to="/login">Ingresa</RouterLink> para inscribir a tu equipo.</p>

      <h2>Equipos inscritos</h2>
      <p v-if="inscripciones.length === 0" class="aviso">Todavía no hay equipos inscritos.</p>
      <div v-for="inscripcion in inscripciones" :key="inscripcion.id" class="tarjeta fila fila-separada">
        <span>
          <RouterLink :to="`/equipos/${inscripcion.equipo.id}`">{{ inscripcion.equipo.nombre }}</RouterLink>
          <span class="etiqueta" :class="{ inactivo: inscripcion.estado !== 'aceptada' }">{{ inscripcion.estado }}</span>
        </span>
        <span class="fila">
          <template v-if="esAdmin">
            <button v-if="inscripcion.estado === 'aceptada'" class="secundario" @click="cambiarEstado(inscripcion, 'rechazada')">Rechazar</button>
            <button v-else class="secundario" @click="cambiarEstado(inscripcion, 'aceptada')">Aceptar</button>
          </template>
          <button v-if="puedeCancelar(inscripcion)" class="peligro" @click="cancelar(inscripcion)">Cancelar</button>
        </span>
      </div>
    </template>
  </section>
</template>
