import { createRouter, createWebHistory } from 'vue-router'
import InicioView from '../views/InicioView.vue'

// Lista de rutas: cada ruta muestra una vista distinta sin recargar la página (SPA)
const routes = [
  { path: '/', name: 'inicio', component: InicioView },
  // Las demás vistas se cargan solo cuando se visitan (carga diferida)
  { path: '/torneos', name: 'torneos', component: () => import('../views/TorneosView.vue') },
  { path: '/equipos', name: 'equipos', component: () => import('../views/EquiposView.vue') },
  { path: '/partidos', name: 'partidos', component: () => import('../views/PartidosView.vue') },
  { path: '/ranking', name: 'ranking', component: () => import('../views/RankingView.vue') },
  // Cualquier ruta que no exista muestra la página "no encontrada"
  { path: '/:pathMatch(.*)*', name: 'no-encontrada', component: () => import('../views/NoEncontradaView.vue') },
]

const router = createRouter({
  history: createWebHistory(), // URLs limpias, sin el símbolo #
  routes,
})

export default router
