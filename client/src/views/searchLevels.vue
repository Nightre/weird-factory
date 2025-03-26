<template>
    <div class="card panel">
        <div class="card-header flex-between">
            <div class="flex">
                <BackBtn />
                <h1>搜索关卡</h1>
            </div>
            <VaButton to="/myLevels" preset="secondary" size="small">我的关卡</VaButton>
        </div>
        <div class="search-box">
            <VaInput v-model="searchQuery" placeholder="输入关卡名称搜索" clearable @update:modelValue="handleSearch">
                <template #appendInner>
                    <VaButton icon="search" preset="plain" @click="handleSearch" />
                </template>
            </VaInput>
        </div>

        <div class="card-body" style="flex: 1;overflow-y: auto;" v-if="!isLoading">
            <ListShow :data="levels.data">
                <div v-for="level in levels.data" :key="level.id">
                    <LevelCard :data="level" />
                </div>
            </ListShow>
            <div class="pagination" v-if="levels.total > 0">
                <VaPagination v-model="page" :pages="Math.ceil(levels.total / pageSize)"
                    @update:modelValue="fetchLevels" />
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { axios } from "@/utils/axios";
import type { IPaggin, ILevelData } from '@/stores/game';
import ListShow from '@/components/listShwo.vue';
import LevelCard from '@/components/levelCard.vue';
import BackBtn from '@/components/backBtn.vue';
const isLoading = ref(true);
const page = ref(1);
const pageSize = 5;
const searchQuery = ref('');

const levels = ref<IPaggin<ILevelData>>({
    page: 1,
    limit: pageSize,
    total: 0,
    data: []
});

const fetchLevels = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('/levels/search', {
            params: {
                search: searchQuery.value,
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

const handleSearch = () => {
    page.value = 1;
    fetchLevels();
};

onMounted(() => {
    fetchLevels();
});
</script>

<style scoped>
.search-box {
    width: 100%;
    background-color: #fff;
    border-bottom: 1px solid #ccc;
    padding: 0.5rem;
}

.search-levels-container {
    padding: 1rem;
    background-color: #fff;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

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