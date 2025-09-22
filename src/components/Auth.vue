<script setup lang="ts">
/**
 * Auth.vue
 *
 * Authentication component for user login and registration.
 * Handles user authentication with email/password and Google sign-in options,
 * form validation, error handling, user feedback, and new player creation in Firestore.
 */
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { ref } from 'vue'
import { useCurrentUser } from 'vuefire'
import { useNotification } from '../composables/useNotification'
import { db } from '../firebase/config'

const { displayNotification } = useNotification()
const user = useCurrentUser() // Current user from VueFire

// Form state
const email = ref('')
const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const isRegistering = ref(false)
const error = ref('')
const isLoading = ref(false)
const showLoginPrompt = ref(false)
const showAuthForm = ref(true)
const auth = getAuth()

/**
 * Handles the authentication process for both login and registration.
 * Validates form inputs, calls appropriate Firebase auth methods,
 * creates player data for new users, and provides feedback via notifications.
 */
const handleAuth = async () => {
  try {
    isLoading.value = true
    error.value = ''

    // Validate password match for registration
    if (isRegistering.value && password.value !== confirmPassword.value) {
      error.value = 'As senhas não coincidem'
      return
    }

    // Select appropriate auth function based on mode
    const authFunction = isRegistering.value
      ? createUserWithEmailAndPassword
      : signInWithEmailAndPassword
    const result = await authFunction(auth, email.value, password.value)

    // For new users, create player data in Firestore
    if (isRegistering.value) {
      await createPlayer(result)
      displayNotification('Conta criada com sucesso!')
    } else {
      displayNotification('Login realizado com sucesso!')
    }
    resetForm()
  } catch (e: any) {
    error.value = e.message
    displayNotification(e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Creates a new player document in Firestore for registered users.
 * Sets up initial player state with level 1, 0 XP, and Rank E.
 *
 * @param {Object} result - Firebase auth result object containing user info
 */
async function createPlayer(result: any) {
  const playerRef = doc(db, 'players', result.user.uid)
  await setDoc(playerRef, {
    name: name.value,
    email: result.user.email,
    createdAt: new Date(),
    level: 1,
    xp: 0,
    rank: 'E',
  })
}

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    displayNotification('Login realizado com sucesso!')
    resetForm()
  } catch (e: any) {
    console.error('Google Sign-In Error:', e)
    displayNotification(e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

/**
 * Resets the form state and hides the auth form.
 * Called after successful authentication or when dismissing the form.
 */
const resetForm = () => {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
  showLoginPrompt.value = false
  showAuthForm.value = false
}

/**
 * Handles user sign out.
 * Signs out from Firebase Auth and displays success notification.
 */
const handleSignOut = () => {
  signOut(auth)
  displayNotification('Logout realizado com sucesso!')
}

/**
 * Dismisses the auth component without taking action.
 * Hides both the login prompt and auth form.
 */
const dismissAuth = () => {
  showLoginPrompt.value = false
  showAuthForm.value = false
}
</script>

<template>
  <div class="auth-container">
    <template v-if="!user">
      <!-- Auth Form -->
      <div v-if="showAuthForm" class="auth-mobile">
        <div class="auth-content">
          <div class="auth-header">
            <h2>{{ isRegistering ? 'Registrar' : 'Entrar' }}</h2>
            <p class="auth-subtitle">
              {{
                isRegistering
                  ? 'Crie sua conta para acompanhar seu progresso'
                  : 'Bem-vindo de volta! Continue sua jornada'
              }}
            </p>
          </div>

          <form @submit.prevent="handleAuth" class="auth-form">
            <div v-if="isRegistering" class="form-group">
              <label for="name">Nome</label>
              <input
                id="name"
                v-model="name"
                type="text"
                placeholder="Digite seu nome"
                required
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="Digite seu email"
                required
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="password">Senha</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Digite sua senha"
                required
                :disabled="isLoading"
                minlength="6"
              />
            </div>

            <div v-if="isRegistering" class="form-group">
              <label for="confirmPassword">Confirmar Senha</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="Digite sua senha novamente"
                required
                :disabled="isLoading"
                minlength="6"
              />
            </div>

            <p v-if="error" class="error">{{ error }}</p>

            <button type="submit" class="primary-btn" :disabled="isLoading">
              {{ isLoading ? 'Processando...' : isRegistering ? 'Registrar' : 'Entrar' }}
            </button>

            <div class="divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              class="google-btn"
              @click="handleGoogleSignIn"
              :disabled="isLoading"
            >
              <img src="../assets/google-icon.svg" alt="Google" class="google-icon" />
              Continuar com Google
            </button>

            <p class="toggle-text">
              {{ isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?' }}
              <button
                type="button"
                class="toggle-btn"
                @click="isRegistering = !isRegistering"
                :disabled="isLoading"
              >
                {{ isRegistering ? 'Entrar' : 'Registrar' }}
              </button>
            </p>
          </form>
        </div>
      </div>
    </template>

    <div v-else class="user-info">
      <div class="user-avatar">
        <img
          :src="user.photoURL || '../assets/hunter-icon.svg'"
          alt="User Avatar"
          class="avatar-img"
        />
      </div>
      <div class="user-details">
        <p class="user-name">{{ user.displayName || user.email }}</p>
        <button class="signout-btn" @click="handleSignOut">Sair</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 0;
  position: relative;
  z-index: 5;
}

.user-info {
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(106, 90, 205, 0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  background-size: 300% 300%;
  animation: gradientFlow 3s ease infinite;
  pointer-events: none;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #6a5acd;
  box-shadow: 0 0 15px rgba(106, 90, 205, 0.5);
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes gradientFlow {
  0%,
  100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.user-name {
  color: #fff;
  font-weight: 500;
  margin: 0;
  font-size: 1rem;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
}

.signout-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 69, 58, 0.1);
  border: 1px solid rgba(255, 69, 58, 0.3);
  color: #ff453a;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  white-space: nowrap;
  align-self: flex-start;
}

.signout-btn:hover {
  background: rgba(255, 69, 58, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 69, 58, 0.2);
}

.signout-btn:active {
  transform: translateY(1px);
}

/* Auth Form Styling */
.auth-mobile {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-content {
  width: 100%;
  background: linear-gradient(135deg, rgba(28, 28, 45, 0.95), rgba(20, 20, 35, 0.95));
  border-radius: 16px;
  padding: 24px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(106, 90, 205, 0.2);
  position: relative;
  overflow: hidden;
}

.auth-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.5), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
  position: relative;
}

.auth-header h2 {
  color: #fff;
  font-size: 1.75rem;
  margin: 0 0 8px;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(106, 90, 205, 0.5);
  letter-spacing: 1px;
}

.auth-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  margin: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: rgba(106, 90, 205, 0.8);
  box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.primary-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.primary-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.primary-btn:hover::before {
  left: 100%;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(106, 90, 205, 0.4);
}

.google-btn {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
}

.google-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.google-icon {
  width: 20px;
  height: 20px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: rgba(255, 255, 255, 0.5);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(106, 90, 205, 0.3);
}

.divider span {
  padding: 0 16px;
  font-size: 0.9rem;
}

.toggle-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-top: 20px;
}

.toggle-btn {
  background: none;
  border: none;
  color: #6a5acd;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  color: #9370db;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
}

.error {
  background: rgba(255, 69, 58, 0.1);
  border: 1px solid rgba(255, 69, 58, 0.3);
  color: #ff453a;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin: 16px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .auth-container {
    padding: 0;
  }

  .auth-content {
    padding: 20px;
  }

  .auth-header h2 {
    font-size: 1.5rem;
  }

  .form-group input,
  .primary-btn,
  .google-btn {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .auth-content {
    padding: 16px;
  }

  .auth-header h2 {
    font-size: 1.3rem;
  }

  .auth-subtitle {
    font-size: 0.85rem;
  }

  .form-group label {
    font-size: 0.85rem;
  }

  .form-group input,
  .primary-btn,
  .google-btn {
    padding: 10px;
    font-size: 0.9rem;
  }
}
</style>
