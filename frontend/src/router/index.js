import { createRouter, createWebHistory } from 'vue-router'
import InicioView from '../views/InicioView.vue'
import { usuarioActual } from '../services/sesion'

// Lista de rutas: cada ruta muestra una vista distinta sin recargar la página (SPA)
// meta.requiereSesion = la ruta solo se puede abrir con la sesión iniciada
const routes = [
  { path: '/', name: 'inicio', component: InicioView },
  // Las demás vistas se cargan solo cuando se visitan (carga diferida)
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/registro', name: 'registro', component: () => import('../views/RegistroView.vue') },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('../views/PerfilView.vue'),
    meta: { requiereSesion: true },
  },
  { path: '/torneos', name: 'torneos', component: () => import('../views/TorneosView.vue') },
  { path: '/equipos', name: 'equipos', component: () => import('../views/EquiposView.vue') },
  // "nuevo" va antes de ":id", si no Vue Router lo tomaría como el id de un equipo
  {
    path: '/equipos/nuevo',
    name: 'equipo-nuevo',
    component: () => import('../views/EquipoFormView.vue'),
    meta: { requiereSesion: true },
  },
  { path: '/equipos/:id', name: 'equipo-detalle', component: () => import('../views/EquipoDetalleView.vue') },
  { path: '/partidos', name: 'partidos', component: () => import('../views/PartidosView.vue') },
  { path: '/ranking', name: 'ranking', component: () => import('../views/RankingView.vue') },
  // Cualquier ruta que no exista muestra la página "no encontrada"
  { path: '/:pathMatch(.*)*', name: 'no-encontrada', component: () => import('../views/NoEncontradaView.vue') },
]

const router = createRouter({
  history: createWebHistory(), // URLs limpias, sin el símbolo #
  routes,
})

// Guardia de navegación: se ejecuta antes de entrar a cada ruta
// Si la ruta requiere sesión y no hay usuario, manda al login y recuerda a dónde quería ir
router.beforeEach((to) => {
  if (to.meta.requiereSesion && !usuarioActual()) {
    return { path: '/login', query: { volver: to.fullPath } }
  }
})

export default router
