<template>
    <div class="card panel">
        <div class="card-header">
            <div class="flex-between">
                <h1 class="title">创建关卡</h1>
                <BackBtn />
            </div>
        </div>
        <div class="card-body" style="overflow-y: auto;">
            <VaForm ref="formRef" class="form">
                <VaInput v-model="formData.title" :rules="[
                    requiredValidate('请输入标题'),
                    minMaxValidate('标题', 2, 50)
                ]" label="标题" placeholder="请输入标题" :disabled="isLoading" />
                <p style="color: #888;font-size: 0.8rem;">游戏内容</p>
                <JsonEditorVue v-model="formData.content" />
                <VaButton :loading="isLoading" :disabled="isLoading" @click="validate() && submit()">
                    创建
                </VaButton>
            </VaForm>
        </div>
    </div>

</template>

<style scoped>
.box {
    height: 100vh;
}

.form {
    gap: 0.7rem;
    background-color: #fff;
    display: flex;
    flex-direction: column;
}
</style>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useForm } from 'vuestic-ui';
import { axios } from "../utils/axios";
import { useRouter } from 'vue-router';
import minMaxValidate from '@/utils/min-max-validate';
import requiredValidate from '@/utils/required-validate';
import JsonEditorVue from 'json-editor-vue'
import initJSON from '@/assets/init.json'
import BackBtn from '@/components/backBtn.vue';
const router = useRouter();
const { validate } = useForm('formRef');
const isLoading = ref(false);

const formData = reactive({
    title: '',
    content: initJSON
});

const submit = async () => {
    isLoading.value = true;
    try {
        const result = await axios.post('/levels/create', {
            ...formData,
            content: formData.content
        });
        if (result.data.success) {
            router.push('/home');  // 假设创建成功后跳转到关卡列表页
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};
</script>