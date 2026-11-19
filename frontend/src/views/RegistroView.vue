<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pedirApi } from '../services/api'
import { iniciarSesion } from '../services/sesion'

const router = useRouter()

// Un solo objeto reactivo con todos los campos del formulario
const form = ref({ nombre: '', alias: '', correo: '', password: '', confirmar: '' })
const error = ref('')
const enviando = ref(false)

// Validación antes de enviar (la API vuelve a validar con el DTO)
function validar() {
  const f = form.value
  if (!f.nombre || !f.alias) return 'Nombre y alias son obligatorios'
  if (!/^\S+@\S+\.\S+$/.test(f.correo)) return 'Escribe un correo válido'
  if (f.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  if (f.password !== f.confirmar) return 'Las contraseñas no coinciden'
  return ''
}

// POST /auth/registro y luego login automático con los mismos datos
async function registrar() {
  error.value = validar()
  if (error.value) return
  enviando.value = true
  const { nombre, alias, correo, password } = form.value
  try {
    await pedirApi('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({ nombre, alias, correo, password }),
    })
    const respuesta = await pedirApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    })
    iniciarSesion(respuesta.token)
    router.push('/perfil')
  } catch (e) {
    error.value = e.message // ej: "El correo ya está registrado"
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section>
    <h1>Crear cuenta</h1>
    <p class="aviso">Las cuentas nuevas son de estudiante.</p>

    <form class="formulario" @submit.prevent="registrar" novalidate>
      <label for="nombre">Nombre</label>
      <input id="nombre" v-model.trim="form.nombre" />

      <label for="alias">Alias de jugador</label>
      <input id="alias" v-model.trim="form.alias" />

      <label for="correo">Correo</label>
      <input id="correo" v-model.trim="form.correo" type="email" autocomplete="username" />

      <label for="password">Contraseña (mínimo 6 caracteres)</label>
      <input id="password" v-model="form.password" type="password" autocomplete="new-password" />

      <label for="confirmar">Repite la contraseña</label>
      <input id="confirmar" v-model="form.confirmar" type="password" autocomplete="new-password" />

      <p v-if="error" class="error">{{ error }}</p>

      <div class="fila">
        <button type="submit" :disabled="enviando">{{ enviando ? 'Creando...' : 'Crear cuenta' }}</button>
        <RouterLink to="/login">Ya tengo cuenta</RouterLink>
      </div>
    </form>
  </section>
</template>

