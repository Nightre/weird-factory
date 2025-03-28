<template>
    <div class="panel card">
        <div class="card-header flex-between">
            <div class="flex-row">
                <BackBtn />
                <h1>我的关卡</h1>
            </div>
            <div class="actions">
                <VaButton color="primary" size="small" preset="secondary" @click="handleCreateLevel"
                    :loading="isCreateLoading">
                    创建新关卡
                </VaButton>
            </div>
        </div>
        <div class="card-body">
            <div style="flex: 1;overflow-y: auto;" v-if="!isLoading">
                <ListShow :data="levels.data">
                    <div v-for="level in levels.data" :key="level.id" class="level-item">
                        <LevelCard :data="level" />
                        <VaButton class="delete-button" size="small" color="danger" @click="confirmDelete(level)">
                            删除
                        </VaButton>
                    </div>
                </ListShow>
                <div class="pagination" v-if="levels.total > 0">
                    <VaPagination v-model="page" :pages="Math.ceil(levels.total / pageSize)"
                        @update:modelValue="fetchLevels" />
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { axios } from "@/utils/axios";
import { useModal } from 'vuestic-ui';
import type { IPaggin, ILevelData } from '@/stores/game';
import ListShow from '@/components/listShwo.vue';
import LevelCard from '@/components/levelCard.vue';
import BackBtn from '@/components/backBtn.vue';
import { useRouter } from 'vue-router';
import initJSON from '@/assets/init.json';

const router = useRouter();
const { confirm } = useModal();

const isLoading = ref(true);
const page = ref(1);
const pageSize = 5;

const levels = ref<IPaggin<ILevelData>>({
    page: 1,
    limit: pageSize,
    total: 0,
    data: []
});

const fetchLevels = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('/levels/my-levels', {
            params: {
                page: page.value,
                limit: pageSize
            }
        });
        levels.value = response.data.data;
    } catch (error) {
        console.error('获取关卡失败:', error);
    } finally {
        isLoading.value = false;
    }
};

const confirmDelete = async (level: ILevelData) => {
    const confirmed = await confirm({
        title: '确认删除',
        message: `确定要删除关卡 "${level.title}" 吗？此操作不可恢复。`,
        okText: '删除',
        cancelText: '取消'
    });

    if (confirmed) {
        deleteLevel(level.id);
    }
};

const deleteLevel = async (id: string) => {
    isLoading.value = true;
    try {
        await axios.delete(`/levels/delete/${id}`);
        fetchLevels();
    } catch (error) {
        console.error('删除关卡失败:', error);
    }
};

const isCreateLoading = ref(false);
const handleCreateLevel = async () => {
    isCreateLoading.value = true;
    try {
        const result = await axios.post('/levels/create', {
            title: '新关卡',
            content: initJSON,
            description: '这个关卡很好玩！'
        });
        if (result.data.success) {
            router.push(`/editLevel/${result.data.data.id}`);
        }
    } catch (error) {
        console.error('创建关卡失败:', error);
    } finally {
        isCreateLoading.value = false;
    }
}

onMounted(() => {
    fetchLevels();
});
</script>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pagination {
    margin-top: 0.5rem;
}

.delete-button {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
}

.level-item {
    position: relative;
}

.loading-state {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
</style>
