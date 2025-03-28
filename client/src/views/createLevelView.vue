<template>
    <div class="card panel">
        <div class="card-header">
            <div class="flex-between">
                <h1 class="title">{{ edit ? '编辑关卡' : '创建关卡' }}</h1>
                <BackBtn />
            </div>
        </div>
        <div class="card-body" style="overflow-y: auto;">
            <VaForm ref="formRef" class="form">
                <VaInput v-model="formData.title" :rules="[
                    requiredValidate('请输入标题'),
                    minMaxValidate('标题', 2, 50)
                ]" label="标题" placeholder="请输入标题" :disabled="isLoading" />
                <VaSwitch v-model="formData.isPublic" label="公开" size="small" />
                <VaTextarea v-model="formData.description" label="关卡介绍" />
                <p style="color: #888;font-size: 0.8rem;">游戏内容</p>
                <JsonEditorVue v-model="formData.content" />
            </VaForm>
        </div>
        <div class="flex-row card-footer">
            <VaButton :loading="isLoading" :disabled="isLoading" @click="validate() && submit()" style="flex: 3;">
                {{ edit ? '保存' : '创建' }}
            </VaButton>
            <VaButton color="secondary" @click="testGame()" v-if="edit" style="flex: 1;">游戏内测试</VaButton>
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
import { watch, onMounted } from 'vue';
import { useJoinRoom } from '@/utils/join-room';

const router = useRouter();
const { validate } = useForm('formRef');
const isLoading = ref(false);
const props = defineProps<{
    edit?: boolean,
    levelId?: string
}>()

const formData = reactive({
    title: '',
    content: initJSON,
    isPublic: false,
    description: ''
});

onMounted(() => {
    if (props.edit) {
        watch(() => props.levelId, async () => {
            const level = await axios.get(`/levels/${props.levelId}`);
            formData.title = level.data.data.title;
            formData.content = level.data.data.content;
            formData.isPublic = level.data.data.isPublic;
            formData.description = level.data.data.description;
        }, { immediate: true })
    }
})

const submit = async (redirect: boolean = true) => {
    isLoading.value = true;
    try {
        const url = props.edit ? `/levels/update/${props.levelId}` : '/levels/create';
        const result = await axios.post(url, {
            ...formData,
            content: formData.content,
            id: props.levelId
        });
        if (result.data.success) {
            if (redirect) {
                router.push(`/level/${result.data.data.id}`);
            }
            return true;
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
    return false;
};

const { joinRoom } = useJoinRoom()
const testGame = async () => {
    if (await submit(false)) {
        joinRoom({
            create: true,
            public: false,
            levelId: props.levelId as string,
            editLevel: props.levelId as string,
        });
    }
}
</script>