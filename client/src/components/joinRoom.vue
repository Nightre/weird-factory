<template>
    <VaModal :beforeOk="beforeOk" size="small" v-model="show" cancelText="取消" :ok-text="okText">
        <VaTabs v-model="tabValue" grow>
            <template #tabs>
                <VaTab v-for="tab in TABS" :key="tab.key" :name="tab.key">
                    {{ tab.title }}
                </VaTab>
            </template>
        </VaTabs>
        <div>
            <div v-if="tabValue == TYPE.JOIN" class="box">
                <VaForm ref="formRef" class="form">
                    <VaInput v-model="form.roomId" :rules="[
                        requiredValidate('请输入房间号'),
                        minMaxValidate('房间号', 6, 6)
                    ]" label="房间号" placeholder="请输入房间号" type="text" :disabled="isLoading" />
                </VaForm>
                <p>加入你朋友的房间</p>
            </div>
            <div class="box">
                <div v-if="tabValue == TYPE.CREATE">
                    <p>创建一个房间让你的朋友加入</p>
                </div>
                <div v-if="tabValue == TYPE.SINGLE || tabValue == TYPE.CREATE">
                    <div v-if="props.level">
                        <p>使用关卡：<span style="color: #888;">{{ props.level.title }}</span></p>
                    </div>
                    <div v-else>
                        <p>使用默认关卡</p>
                    </div>
                </div>
            </div>
        </div>
    </VaModal>
</template>
<script setup lang="ts">

import { useJoinRoom } from '@/utils/join-room';
import minMaxValidate from '@/utils/min-max-validate';
import requiredValidate from '@/utils/required-validate';
import { computed, reactive, ref } from 'vue';
import { useForm } from 'vuestic-ui';
import type { ILevelData } from '@/stores/game';

const props = defineProps<{ level?: ILevelData }>()
const canJoin = computed(() => !Boolean(props.level))

const { validate } = useForm('formRef');
const { joinRoom } = useJoinRoom()

const beforeOk = () => {
    switch (tabValue.value) {
        case TYPE.CREATE:
            joinRoom({
                roomId: form.roomId,
                create: true,
                public: true,
                levelId: props.level?.id
            })
            break;

        case TYPE.JOIN:
            if (validate()) {
                joinRoom({
                    roomId: form.roomId,
                    create: false,
                    public: true,
                    levelId: props.level?.id
                })
            }
            break;
        case TYPE.SINGLE:
            joinRoom({
                roomId: form.roomId,
                create: true,
                public: false,
                levelId: props.level?.id
            })
            break;
    }
}

const form = reactive({
    roomId: ''
})

enum TYPE {
    CREATE,
    JOIN,
    SINGLE
}

const show = defineModel("show", { type: Boolean, default: false })
const tabValue = defineModel("tabValue", { type: Number, default: TYPE.CREATE })
const isLoading = ref(false)

const TABS = canJoin.value ? [
    { title: "创建房间", key: TYPE.CREATE },
    { title: "加入房间", key: TYPE.JOIN },
] : [
    { title: "联机", key: TYPE.CREATE },
    { title: "单人", key: TYPE.SINGLE },
]

const okText = computed(() => {
    return {
        [TYPE.CREATE]: "创建",
        [TYPE.JOIN]: "加入",
        [TYPE.SINGLE]: "开始",
    }[tabValue.value]
})
</script>

<style scoped>
.box {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
</style>