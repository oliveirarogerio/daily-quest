import './assets/main.css'
import { createApp } from 'vue'
import { VueFire, VueFireAuth } from 'vuefire'
import App from './App.vue'
import { app as firebaseApp } from './firebase/app'

const app = createApp(App)

app
  .use(VueFire, {
    firebaseApp,
    modules: [VueFireAuth()],
  })
  .mount('#app')
