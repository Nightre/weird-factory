<script setup lang="ts">
import { onMounted } from 'vue';
import { axios } from './utils/axios';
import { RouterLink, RouterView, useRoute } from 'vue-router'
import type { successReq } from './utils/type';
import { useUserStore } from './stores/user';
import { useRouter } from 'vue-router';

const store = useUserStore()
const router = useRouter()

onMounted(async () => {
  const res = await axios.get<successReq>('/users/check-login')
  if (res.data.data) {
    store.setLogin(res.data.data)
  } else {
    router.push('/')
    store.logout()
  }    
})
</script>
<style>
body {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: unset !important;
}
</style>
<template>
  <RouterView />
</template>