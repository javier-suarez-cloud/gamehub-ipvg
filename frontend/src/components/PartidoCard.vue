<script setup>
import { RouterLink } from 'vue-router'
import { formatearFechaHora } from '../services/formato'

// props: datos que recibe este componente desde la vista que lo usa (padre)
const props = defineProps({
  partido: { type: Object, required: true },
  esAdmin: { type: Boolean, default: false },
})

// emit: eventos que este componente le avisa al padre
const emit = defineEmits(['eliminar'])

// El botón no borra nada: solo avisa al padre, que pide confirmación y llama a la API
function pedirEliminar() {
  emit('eliminar', props.partido)
}
</script>

<template>
  <!-- Tarjeta reutilizable de un partido (se repite con v-for en PartidosView) -->
  <article class="tarjeta">
    <div class="fila fila-separada">
      <h3>{{ partido.torneo.nombre }}</h3>
      <span class="etiqueta" :class="partido.estado === 'jugado' ? '' : 'inactivo'">{{ partido.estado }}</span>
    </div>
    <p class="aviso">{{ partido.ronda }} · {{ formatearFechaHora(partido.fechaHora) }}</p>

    <!-- Marcador: si el partido ya tiene resultado se muestran los puntajes -->
    <p class="marcador">
      <strong>{{ partido.equipoLocal.nombre }}</strong>
      <span v-if="partido.resultado"> {{ partido.resultado.puntajeLocal }} - {{ partido.resultado.puntajeVisitante }} </span>
      <span v-else> vs </span>
      <strong>{{ partido.equipoVisitante.nombre }}</strong>
    </p>

    <div class="fila">
      <RouterLink :to="`/partidos/${partido.id}`" class="boton">Ver detalle</RouterLink>
      <!-- v-if: el botón solo existe para el administrador -->
      <button v-if="esAdmin" class="peligro" @click="pedirEliminar">Eliminar</button>
    </div>
  </article>
</template>
