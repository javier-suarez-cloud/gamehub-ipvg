<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { usuario, cerrarSesion } from '../services/sesion'

const router = useRouter()

// Cierra la sesión y vuelve al inicio
function salir() {
  cerrarSesion()
  router.push('/')
}
</script>

<template>
  <!-- Barra de navegación con el mismo diseño de las actividades anteriores -->
  <header class="navbar">
    <div class="marca">
      <h2>GameHub IPVG</h2>
    </div>

    <!-- RouterLink cambia de vista sin recargar la página -->
    <nav>
      <RouterLink to="/">Inicio</RouterLink>
      <RouterLink to="/torneos">Torneos</RouterLink>
      <RouterLink to="/equipos">Equipos</RouterLink>
      <RouterLink to="/partidos">Partidos</RouterLink>
      <RouterLink to="/ranking">Ranking</RouterLink>

      <!-- Cambia según haya sesión o no (v-if / v-else) -->
      <template v-if="usuario">
        <RouterLink to="/perfil">Mi perfil</RouterLink>
        <!-- v-show: la etiqueta queda en el DOM y solo se oculta si no es admin -->
        <span v-show="usuario.rol === 'admin'" class="etiqueta">admin</span>
        <button class="secundario" @click="salir">Salir</button>
      </template>
      <template v-else>
        <RouterLink to="/login">Ingresar</RouterLink>
        <RouterLink to="/registro">Registrarse</RouterLink>
      </template>
    </nav>
  </header>
</template>
