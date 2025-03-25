<template>
    <VaModal :beforeOk="beforeOk" size="small" v-model="show" cancelText="取消" :ok-text="tabValue == 0 ? '创建' : '加入'">
        <VaTabs v-model="tabValue" grow>
            <template #tabs>
                <VaTab v-for="tab in TABS" :key="tab.key" :name="tab.key">
                    {{ tab.title }}
                </VaTab>
            </template>
        </VaTabs>
        <div>
            <div v-if="tabValue == TYPE.JOIN" class="box">
                <VaForm ref="formRef" class="flex flex-col form">
                    <VaInput v-model="form.roomId" :rules="[
                        requiredValidate('请输入房间号'),
                        minMaxValidate('房间号', 6, 6)
                    ]" label="房间号" placeholder="请输入房间号" type="text" :disabled="isLoading" />
                </VaForm>
                <p>加入你朋友的房间</p>
            </div>
            <div v-else class="box">
                <p>创建一个房间让你的朋友加入</p>
            </div>
        </div>
    </VaModal>
</template>
<script setup lang="ts">

import { useJoinRoom } from '@/utils/join-room';
import minMaxValidate from '@/utils/min-max-validate';
import requiredValidate from '@/utils/required-validate';
import { reactive, ref } from 'vue';
import { useForm } from 'vuestic-ui';

const { validate, isValid } = useForm('formRef');
const { joinRoom } = useJoinRoom()

const beforeOk = () => {
    if (validate() || (tabValue.value !== TYPE.JOIN)) {
        show.value = false
        joinRoom({
            roomId: form.roomId,
            create: tabValue.value == TYPE.CREATE,
            public: true,
        })
    }
}

const form = reactive({
    roomId: ''
})

enum TYPE {
    CREATE,
    JOIN
}

const show = defineModel("show", { type: Boolean, default: false })
const tabValue = defineModel("tabValue", { type: Number, default: TYPE.CREATE })
const isLoading = ref(false)

const TABS = [
    { title: "创建房间", key: TYPE.CREATE },
    { title: "加入房间", key: TYPE.JOIN },
];
</script>

<style scoped>
.box {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>