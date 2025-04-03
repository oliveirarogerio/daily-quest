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
  padding: 16px;
  position: relative;
  z-index: 5;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-info {
  background: linear-gradient(135deg, rgba(28, 28, 45, 0.95), rgba(20, 20, 35, 0.95));
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(106, 90, 205, 0.1);
  position: relative;
  overflow: hidden;
}

.user-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    linear-gradient(45deg, transparent 45%, rgba(106, 90, 205, 0.1) 50%, transparent 55%),
    linear-gradient(-45deg, transparent 45%, rgba(106, 90, 205, 0.1) 50%, transparent 55%);
  background-size: 300% 300%;
  animation: gradientFlow 3s ease infinite;
  pointer-events: none;
}

@keyframes gradientFlow {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
}

.user-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user-name {
  color: #fff;
  font-weight: 500;
  margin: 0;
  font-size: 0.95rem;
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(20, 20, 35, 0.98);
  backdrop-filter: blur(20px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.auth-content {
  width: 100%;
  max-width: 400px;
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
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
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
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
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

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.footer {
  margin-top: auto;
  padding-top: 16px;
  text-align: center;
}

.footer-link {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.footer-link:hover {
  color: #6a5acd;
  text-shadow: 0 0 10px rgba(106, 90, 205, 0.5);
}
</style>
