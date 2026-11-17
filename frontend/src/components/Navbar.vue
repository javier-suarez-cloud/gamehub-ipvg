<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <!-- Menú de navegación: RouterLink cambia de vista sin recargar la página -->
  <nav class="navbar">
    <strong>GameHub IPVG</strong>
    <RouterLink to="/">Inicio</RouterLink>
    <RouterLink to="/torneos">Torneos</RouterLink>
    <RouterLink to="/equipos">Equipos</RouterLink>
    <RouterLink to="/partidos">Partidos</RouterLink>
    <RouterLink to="/ranking">Ranking</RouterLink>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  background: #1f2937;
}

.navbar a {
  color: #e5e7eb;
  text-decoration: none;
}

/* Clase que Vue Router agrega al enlace de la página actual */
.navbar a.router-link-active {
  color: #60a5fa;
}
</style>
