<script setup>
import { RouterLink } from 'vue-router'

// props: datos que recibe este componente desde la vista que lo usa (padre)
const props = defineProps({
  torneo: { type: Object, required: true },
  esAdmin: { type: Boolean, default: false },
})

// emit: eventos que este componente le avisa al padre
const emit = defineEmits(['eliminar'])

// El botón no borra nada: solo avisa al padre, que decide qué hacer
function pedirEliminar() {
  emit('eliminar', props.torneo)
}
</script>

<template>
  <!-- Tarjeta reutilizable de un torneo (se repite con v-for en TorneosView) -->
  <article class="tarjeta">
    <div class="fila fila-separada">
      <h3>{{ torneo.nombre }}</h3>
      <span class="etiqueta" :class="torneo.estado">{{ torneo.estado }}</span>
    </div>
    <p class="aviso">{{ torneo.videojuego }} · {{ torneo.modalidad }}</p>
    <p>Inicio: {{ torneo.fechaInicio }} · Inscripción hasta: {{ torneo.cierreInscripcion }}</p>
    <p>Cupo: {{ torneo.cupoMaximo }} equipos</p>

    <div class="fila">
      <RouterLink :to="`/torneos/${torneo.id}`" class="boton">Ver detalle</RouterLink>
      <!-- v-if: el botón solo existe para el administrador -->
      <button v-if="esAdmin" class="peligro" @click="pedirEliminar">Eliminar</button>
    </div>
  </article>
</template>
