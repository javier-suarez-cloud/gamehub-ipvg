import { ref } from 'vue'

// Funciones para saber quién tiene la sesión iniciada en el navegador.
// El token JWT se guarda en localStorage al iniciar sesión (lo usa también services/api.js).

// Devuelve los datos del usuario que van dentro del token ({ id, correo, rol }) o null si no hay sesión
export function usuarioActual() {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    // Un JWT tiene 3 partes separadas por punto; la del medio (payload) trae los datos en base64
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const datos = JSON.parse(atob(payload))
    // "exp" es la fecha de vencimiento en segundos; si ya pasó, la sesión no vale
    if (datos.exp && datos.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return null
    }
    return datos
  } catch {
    return null // token dañado: se trata como si no hubiera sesión
  }
}

// Estado reactivo de la sesión: el menú y las vistas se actualizan solos al entrar o salir
export const usuario = ref(usuarioActual())

// Guarda el token del login y actualiza el estado
export function iniciarSesion(token) {
  localStorage.setItem('token', token)
  usuario.value = usuarioActual()
}

// Borra el token y deja la sesión cerrada
export function cerrarSesion() {
  localStorage.removeItem('token')
  usuario.value = null
}
