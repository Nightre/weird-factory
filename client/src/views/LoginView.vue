<template>
  <VaCard outlined class="box">
    <VaCardContent>
      <VaForm ref="formRef" class="flex-col form">
        <h1 class="title">
          {{ text[tabValue] }}账户
        </h1>
        <VaDivider />
        <VaTabs v-model="tabValue" center :disabled="isLoading">
          <template #tabs>
            <VaTab v-for="tab in text" :key="tab">
              {{ tab }}
            </VaTab>
          </template>
        </VaTabs>

        <VaInput v-model="form.name" :rules="[
          requiredValidate('请输入名字'),
          minMaxValidate('名字', 2, 12)
        ]" label="名字" placeholder="请输入名字" type="text" :disabled="isLoading" />

        <VaInput v-if="tabValue == TYPE.R" v-model="form.email" :rules="[
          requiredValidate('请输入邮箱'),
          (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '邮箱格式不正确'
        ]" label="邮箱地址" placeholder="请输入邮箱" type="email" :disabled="isLoading" />

        <VaInput v-model="form.password" :rules="[
          requiredValidate('请输入密码'),
          minMaxValidate('密码', 6)
        ]" label="密码" placeholder="请输入密码" type="password" :disabled="isLoading" />

        <VaButton :disabled="isLoading" @click="validate() && submit()" :loading="isLoading">
          {{ text[tabValue] }}
        </VaButton>
      </VaForm>
    </VaCardContent>
  </VaCard>
</template>
<style scoped>
.box {
  width: 80%;
  max-width: 300px;
  margin: auto;
  position: absolute;
  left: 50vw;
  top: 50vh;
  transform: translate(-50%, -50%);
}

.form {
  gap: 0.7rem;
}
</style>
<script setup lang="ts">
import minMaxValidate from '@/utils/min-max-validate';
import requiredValidate from '@/utils/required-validate';
import { reactive, ref, toRaw } from 'vue';
import { useForm } from 'vuestic-ui';
import { axios } from "../utils/axios";
import { useRouter, useRoute } from 'vue-router';
import type { successReq as ReqType } from '@/utils/type';
import { useUserStore } from '@/stores/user';

const router = useRouter()
const route = useRoute()

enum TYPE {
  L = 0,
  R = 1
}

const { validate } = useForm('formRef');
const text = ['登录', '注册']

const isLoading = ref(false)
const tabValue = ref(TYPE.L)

const { setLogin } = useUserStore()

const form = reactive<{
  name: string,
  email?: string,
  password: string,
}>({
  name: '',
  email: '',
  password: '',
});

const login = async () => {
  const data = toRaw(form)
  delete data.email

  return axios.post<ReqType>('/users/login', data)
}

const register = async () => {
  return axios.post<ReqType>('/users/register', form)
}

const submit = async () => {
  isLoading.value = true
  try {
    let promise
    switch (tabValue.value) {
      case TYPE.R:
        promise = register()
        break;
      case TYPE.L:
        promise = login()
        break;
    }
    const result = await promise
    if (result.data.success) {
      setLogin(result.data.data)
      // 获取重定向地址
      const redirect = route.query.redirect as string
      router.push(redirect || '/home')
    }
  } catch (error) {
    isLoading.value = false
  } finally {
    isLoading.value = false
  }
};
</script>