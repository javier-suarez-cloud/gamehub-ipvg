// Funciones para saber quién tiene la sesión iniciada en el navegador.
// El token JWT se guarda en localStorage al iniciar sesión (lo usa también services/api.js).

// Devuelve los datos del usuario que van dentro del token ({ id, correo, rol }) o null si no hay sesión
export function usuarioActual() {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    // Un JWT tiene 3 partes separadas por punto; la del medio (payload) trae los datos en base64
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch {
    return null // token dañado: se trata como si no hubiera sesión
  }
}
