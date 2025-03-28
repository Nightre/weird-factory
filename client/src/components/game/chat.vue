<template>
    <h3>消息</h3>
    <div class="message-list">
        <p v-for="message in (store.roomState as IRoomState).msg" class="message">
            {{ message }}
        </p>
    </div>
    <VaForm ref="formRef">
        <div class="flex-row">
            <VaInput v-model="message" placeholder="输入消息" :rules="[
                requiredValidate('请输入消息'),
                minMaxValidate('消息长度不能超过100个字符', 1, 100)
            ]" style="width: 11rem;" />
            <VaButton :loading="isLoading" @click="validate() && submit()" icon="send" style="flex: 1;">

            </VaButton>
        </div>
    </VaForm>
</template>

<script setup lang="ts">
import { type IRoomState } from '@/stores/game';
import { useGameStore } from '@/stores/game';
import { ref } from 'vue';
import { useForm } from 'vuestic-ui';
import minMaxValidate from '@/utils/min-max-validate';
import requiredValidate from '@/utils/required-validate';

const message = ref('')
const { validate, resetValidation } = useForm('formRef');

const store = useGameStore()
const isLoading = ref(false)
const submit = async () => {
    isLoading.value = true
    await props.sendMessageEmit(message.value)
    message.value = ''
    isLoading.value = false
    resetValidation()
}

const props = defineProps<{
    sendMessageEmit: (message: string) => Promise<unknown>
    messages: string[]
}>()

</script>

<style scoped>
.message-list {
    min-height: 10rem;
    overflow-y: auto;
    flex: 1;
    padding: 1rem;
    background-color: rgb(220, 220, 220);
    border-radius: 0.5rem;
}
</style>