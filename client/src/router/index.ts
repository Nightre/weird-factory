import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import GameView from '@/views/GameView.vue'
import { useUserStore } from '@/stores/user'
import HelpView from '@/views/HelpView.vue'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import StartView from '@/views/StartView.vue'
import CreateLevelView from '@/views/createLevelView.vue'
import ViewLevelView from '@/views/viewLevel.vue'
import MyLevelsView from '@/views/myLevels.vue'
import SearchLevelsView from '@/views/searchLevels.vue'
import EditLevelView from '@/views/editLevelView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Start',
      component: StartView,
      meta: { orientation: 'landscape' }
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { orientation: 'landscape' }
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { orientation: 'portrait' }
    },
    {
      path: '/game',
      name: 'Game',
      component: GameView,
      meta: { requiresAuth: true, orientation: 'landscape' }
    },
    {
      path: '/help',
      name: 'help',
      component: HelpView,
      meta: { orientation: 'portrait' }
    },
    // {
    //   path: '/createLevel',
    //   name: 'createLevel',
    //   component: CreateLevelView,
    //   meta: { orientation: 'landscape' }
    // },
    {
      path: '/editLevel/:id',
      name: 'editLevel',
      component: EditLevelView,
      meta: { orientation: 'landscape' }
    },
    {
      path: '/level/:id',
      name: 'viewLevel',
      component: ViewLevelView,
      meta: { orientation: 'landscape' }
    },
    {
      path: '/myLevels',
      name: 'myLevels',
      component: MyLevelsView,
      meta: { orientation: 'landscape' }
    },
    {
      path: '/searchLevels',
      name: 'searchLevels',
      component: SearchLevelsView,
      meta: { orientation: 'landscape' }
    },
  ],
})


router.beforeEach(async (to, from, next) => {
  const store = useUserStore()

  if (to.meta.orientation && import.meta.env.VITE_TYPE === 'mobile') {
    if (to.meta.orientation === 'landscape') {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    } else if (to.meta.orientation === 'portrait') {
      await ScreenOrientation.lock({ orientation: 'portrait' });
    }
  }

  if (to.meta.requiresAuth) {
    if (!store.isLogin) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    if (to.path === '/login' && store.isLogin) {
      next('/')
    } else {
      next()
    }
  }
})

export default router
