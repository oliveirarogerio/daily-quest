<script setup lang="ts">
import { ref } from 'vue'
import { useCurrentUser } from 'vuefire'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
const user = useCurrentUser()
const email = ref('')
const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const isRegistering = ref(false)
const error = ref('')
const isLoading = ref(false)
const showLoginPrompt = ref(true)
const showAuthForm = ref(false)
const auth = getAuth()

const handleAuth = async () => {
  try {
    isLoading.value = true
    error.value = ''

    if (isRegistering.value && password.value !== confirmPassword.value) {
      error.value = t('auth.passwordMismatch')
      return
    }

    const authFunction = isRegistering.value
      ? createUserWithEmailAndPassword
      : signInWithEmailAndPassword
    const result = await authFunction(auth, email.value, password.value)

    if (isRegistering.value) {
      await createPlayer(result)
    }
    resetForm()
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

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
    resetForm()
  } catch (e) {
    console.error('Google Sign-In Error:', e)
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
  showLoginPrompt.value = false
  showAuthForm.value = false
}

const handleSignOut = () => signOut(auth)

const startAuth = () => {
  showLoginPrompt.value = false
  showAuthForm.value = true
}

const dismissAuth = () => {
  showLoginPrompt.value = false
  showAuthForm.value = false
}
</script>

<template>
  <div class="auth-container">
    <template v-if="!user">
      <!-- Login Prompt -->
      <div v-if="showLoginPrompt" class="login-prompt">
        <div class="login-prompt-content">
          <button
            class="auth-btn register-btn"
            @click.stop="
              () => {
                startAuth()
              }
            "
          >
            {{ t('auth.login') }}
          </button>
        </div>
      </div>

      <!-- Auth Form -->
      <div v-if="showAuthForm" class="auth-mobile">
        <div class="auth-content">
          <div class="auth-header">
            <h2>{{ isRegistering ? t('auth.register') : t('auth.login') }}</h2>
            <p class="auth-subtitle">
              {{ isRegistering ? t('auth.createAccount') : t('auth.welcomeBack') }}
            </p>
            <button class="close-btn" @click="dismissAuth">×</button>
          </div>

          <form @submit.prevent="handleAuth" class="auth-form">
            <div v-if="isRegistering" class="form-group">
              <label for="name">{{ t('auth.name') }}</label>
              <input
                id="name"
                v-model="name"
                type="text"
                :placeholder="t('auth.namePlaceholder')"
                required
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="email">{{ t('auth.email') }}</label>
              <input
                id="email"
                v-model="email"
                type="email"
                :placeholder="t('auth.emailPlaceholder')"
                required
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="password">{{ t('auth.password') }}</label>
              <input
                id="password"
                v-model="password"
                type="password"
                :placeholder="t('auth.passwordPlaceholder')"
                required
                :disabled="isLoading"
                minlength="6"
              />
            </div>

            <div v-if="isRegistering" class="form-group">
              <label for="confirmPassword">{{ t('auth.confirmPassword') }}</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                :placeholder="t('auth.confirmPasswordPlaceholder')"
                required
                :disabled="isLoading"
                minlength="6"
              />
            </div>

            <p v-if="error" class="error">{{ error }}</p>

            <button type="submit" class="primary-btn" :disabled="isLoading">
              {{
                isLoading
                  ? t('auth.processing')
                  : isRegistering
                    ? t('auth.register')
                    : t('auth.login')
              }}
            </button>

            <div class="divider">
              <span>{{ t('auth.or') }}</span>
            </div>

            <button
              type="button"
              class="google-btn"
              @click="handleGoogleSignIn"
              :disabled="isLoading"
            >
              <img src="../assets/google-icon.svg" alt="Google" class="google-icon" />
              {{ t('auth.continueWithGoogle') }}
            </button>

            <p class="toggle-text">
              {{ isRegistering ? t('auth.alreadyHaveAccount') : t('auth.noAccount') }}
              <button
                type="button"
                class="toggle-btn"
                @click="isRegistering = !isRegistering"
                :disabled="isLoading"
              >
                {{ isRegistering ? t('auth.login') : t('auth.register') }}
              </button>
            </p>
          </form>
        </div>
      </div>
    </template>

    <div v-else class="user-info">
      <div class="user-details">
        <p class="user-name">{{ user.displayName || user.email }}</p>
        <button class="signout-btn" @click="handleSignOut">{{ t('auth.signOut') }}</button>
      </div>
    </div>

    <div class="footer">
      <a
        href="https://github.com/oliveirarogerio"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >
        {{ t('footer.madeBy') }}
      </a>
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

/* Footer styling */
.footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(106, 90, 205, 0.3);
  text-align: center;
  position: relative;
  z-index: 1;
}

.footer-link {
  color: #9370db;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.footer-link:hover {
  color: #6a5acd;
  transform: translateY(-2px);
  text-shadow: 0 0 5px rgba(106, 90, 205, 0.7);
}

.footer-link::before {
  font-size: 1rem;
}

/* Responsive styles for footer */
@media (max-width: 768px) {
  .footer {
    margin-top: 15px;
    padding-top: 12px;
  }

  .footer-link {
    font-size: 0.85rem;
  }
}

.auth-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 42, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}

.auth-content {
  width: 100%;
  max-width: 350px;
  padding: 2rem;
  background: rgba(42, 42, 68, 0.5);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(106, 90, 205, 0.2);
  margin: 1rem;
  position: relative;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  color: #fff;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.auth-subtitle {
  color: #9370db;
  font-size: 1rem;
  opacity: 0.8;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(106, 90, 205, 0.3);
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #6a5acd;
  box-shadow: 0 0 0 2px rgba(106, 90, 205, 0.2);
}

.primary-btn {
  width: 100%;
  padding: 0.875rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #6a5acd, #9370db);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(106, 90, 205, 0.3);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(106, 90, 205, 0.3);
}

.divider span {
  padding: 0 1rem;
  color: #9370db;
  font-size: 0.9rem;
}

.google-btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(106, 90, 205, 0.3);
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.google-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.google-icon {
  width: 20px;
  height: 20px;
}

.toggle-text {
  text-align: center;
  color: #9370db;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.toggle-btn {
  background: none;
  border: none;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
}

.toggle-btn:hover:not(:disabled) {
  color: #6a5acd;
}

.error {
  color: #ff6b6b;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(42, 42, 68, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(106, 90, 205, 0.2);
}

@media (max-width: 768px) {
  .user-info {
    height: 80px;
  }

  .signout-btn {
  }
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #6a5acd;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  color: #fff;
  font-weight: 500;
  margin: 0 0 0.5rem;
}

.signout-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(106, 90, 205, 0.3);
  color: #9370db;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.signout-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

@media (max-width: 768px) {
  .auth-content {
    margin: 0.5rem;
    padding: 1.5rem;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .auth-mobile {
    align-items: flex-start;
    padding-top: max(2rem, env(safe-area-inset-top));
  }

  .auth-header h2 {
    font-size: 1.5rem !important;
  }

  .auth-subtitle {
    font-size: 0.9rem !important;
  }

  input,
  .primary-btn,
  .google-btn {
    font-size: 1rem !important;
    padding: 0.75rem !important;
    height: 48px;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
}

.login-prompt {
  margin: 0.75rem auto;
  padding: 0.75rem;
  background: transparent;
  width: 100%;
  max-width: 280px;
}

.login-prompt-content {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.auth-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 100px;
}

.signin-btn {
  background: rgba(106, 90, 205, 0.1);
  color: #6a5acd;
  border: 1px solid rgba(106, 90, 205, 0.3);
}

.signin-btn:hover {
  background: rgba(106, 90, 205, 0.2);
}

.register-btn {
  background: #6a5acd;
  color: white;
}

.register-btn:hover {
  background: #5a4abf;
}

@media (max-width: 768px) {
  .login-prompt {
    margin: 0.5rem auto;
    padding: 0.5rem;
    max-width: calc(100% - 2rem);
  }

  .auth-btn {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #9370db;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #fff;
  transform: scale(1.1);
}
</style>
