<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
</script>

<template>
  <!-- El menú se ve en todas las páginas -->
  <Navbar />

  <!-- Aquí Vue Router dibuja la vista de la ruta actual -->
  <main class="pagina">
    <RouterView />
  </main>

  <footer>
    <p>GameHub IPVG · Torneos de videojuegos y eSports</p>
  </footer>
</template>
