// Dirección base de la API NestJS
const API_URL = 'http://localhost:3000'

// Función común para todas las llamadas a la API con fetch()
export async function pedirApi(ruta, opciones = {}) {
  const token = localStorage.getItem('token') // token JWT guardado al iniciar sesión

  const r = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      // Si hay sesión, envía el token para las rutas protegidas
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  // Algunas respuestas no traen cuerpo; en ese caso queda null
  const datos = await r.json().catch(() => null)

  if (!r.ok) {
    // Nest envía el error en "message" (texto o arreglo si es de validación)
    const mensaje = Array.isArray(datos?.message) ? datos.message.join(', ') : datos?.message
    throw new Error(mensaje || 'Error al comunicarse con el servidor')
  }

  return datos
}
