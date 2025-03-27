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
  UserCredential,
  type AuthError
} from 'firebase/auth'

import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
const user = useCurrentUser()
const email = ref('')
const name = ref('')
const password = ref('')
const isRegistering = ref(false)
const error = ref('')
const isLoading = ref(false)
const auth = getAuth()


const handleAuth = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const authFunction = isRegistering.value
      ? createUserWithEmailAndPassword
      : signInWithEmailAndPassword
    const result = await authFunction(auth, email.value, password.value)
    if (isRegistering.value) {
      await createPlayer(result)
    }
    resetForm()
  } catch (e) {
    error.value = (e as AuthError).message
  } finally {
    isLoading.value = false
  }
}

async function createPlayer(result: UserCredential) {
  const playerRef = doc(db, 'players', result.user.uid)
  await setDoc(playerRef, {
    name: name.value,
    email: result.user.email,
    createdAt: new Date(),
    level: 1,
    xp: 0,
    rank: "E",
  })
}

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const provider = new GoogleAuthProvider()
    console.log('provider', provider)
    console.log('auth', auth)
    await signInWithPopup(auth, provider)
    console.log('handleGoogleSignIn')
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
  error.value = ''
}

const handleSignOut = () => signOut(auth)
</script>

<template>
  <div class="auth-container">
    <div v-if="!user" class="auth-form">
      <h2>{{ isRegistering ? 'Register' : 'Login' }}</h2>

      <form @submit.prevent="handleAuth">
        <div class="form-group">
          <input
            v-model="name"
            type="string"
            placeholder="Name"
            required
            :disabled="isLoading"
            v-if="isRegistering"
          />
        </div>
        <div class="form-group">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            required
            :disabled="isLoading"
            minlength="6"
          />
        </div>



        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <button
          type="submit"
          class="primary-btn"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Login') }}
        </button>

        <button
          type="button"
          class="google-btn"
          @click="handleGoogleSignIn"
          :disabled="isLoading"
        >
          Continue with Google
        </button>
      </form>

      <p class="toggle-text">
        {{ isRegistering ? 'Already have an account?' : "Don't have an account?" }}
        <button
          class="toggle-btn"
          @click="isRegistering = !isRegistering"
          :disabled="isLoading"
        >
          {{ isRegistering ? 'Login' : 'Register' }}
        </button>
      </p>
    </div>

    <div v-else class="user-info">
      <p>Welcome, {{ user.email }}</p>
      <button class="signout-btn" @click="handleSignOut">Sign Out</button>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: rgba(106, 90, 205, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h2 {
  color: #6a5acd;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid rgba(106, 90, 205, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #6a5acd;
}

input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: #ff6b6b;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  text-align: center;
}

button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.primary-btn {
  background: #6a5acd;
  color: white;
  margin-bottom: 1rem;
}

.primary-btn:hover:not(:disabled) {
  background: #9370db;
  transform: translateY(-1px);
}

.google-btn {
  background: #fff;
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.google-btn:hover:not(:disabled) {
  background: #f5f5f5;
  transform: translateY(-1px);
}

.toggle-text {
  text-align: center;
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.toggle-btn {
  background: none;
  border: none;
  color: #6a5acd;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin: 0;
  font-size: inherit;
  width: auto;
}

.toggle-btn:hover:not(:disabled) {
  color: #9370db;
}

.user-info {
  text-align: center;
  color: #fff;
}

.signout-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  margin-top: 1rem;
}

.signout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

@media (max-width: 480px) {
  .auth-container {
    padding: 1.5rem;
  }
}
</style>
