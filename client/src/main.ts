import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import axios from 'axios'
import { useToast } from 'vuestic-ui'
import { useGameStore, type IRoomState } from './stores/game'
// @ts-ignore
import { SplashScreen } from '@capacitor/splash-screen'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(createVuestic())

app.mount('#app')

if (import.meta.env.VITE_TYPE === 'mobile') {
    SplashScreen.hide();
}

declare module 'axios' {
    export interface AxiosRequestConfig {
        customErrorMessage?: string;
    }
}

(window as any).debugPinia = ()=>{
    const store = useGameStore()
    console.log(store)
}