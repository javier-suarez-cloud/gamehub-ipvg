// Funciones para mostrar datos con formato legible en las vistas

// Convierte una fecha ISO de la API (ej: 2026-12-21T18:00:00.000Z) en texto: "21 dic 2026, 15:00"
export function formatearFechaHora(fechaIso) {
  return new Date(fechaIso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
}
