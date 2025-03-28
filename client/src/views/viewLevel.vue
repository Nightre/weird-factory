<template>
    <JoinRoomModel :level="level" v-model:show="isShowRoomModel" />
    <div class="card panel">
        <div class="card-header">
            <div class="flex-between">
                <h1>{{ level.title }} <span style="color: #888;font-size: 0.8rem;">作者：{{ level.author?.name }}</span>
                </h1>
                <BackBtn />
            </div>
        </div>


        <div class="card-body" style="flex: 1;overflow-y: auto;" v-if="!isLoading && level.content">
            <h1 style="margin: 0.5rem 0;">关卡简介</h1>
            <div v-if="level.description" v-html="markdown.render(level.description)">

            </div>

            <h1 style="margin: 0.5rem 0;">关卡内容</h1>
            <p>初始金币：{{ level.content.init_money }}</p>
            <p>初始物品：{{level.content.init_items.map((item: IMarketItem) => item.name).join(', ')}}</p>
            <p>可购买商品：{{ marketItems.join(', ') }}</p>

            <!-- <JsonEditorVue :model-value="level.content" read-only /> -->
            <!-- <VaCollapse v-model="showContent" header="关卡代码" color="#3D92FF" color-all
                icon="info" style="margin-top: 0.5rem;">
                <JsonEditorVue :model-value="level.content" read-only />
            </VaCollapse> -->
            
        </div>

        <div class="card-footer">
            <VaButton preset="secondary" border-color="primary" :loading="isLikeLoading" :disabled="isLikeLoading"
                @click="handleLike">
                <VaIcon name="favorite" :color="level.isLiked ? '#ff5252' : '#888'" />
                <span style="margin-left: 0.5rem;">{{ level.likes }}</span>
            </VaButton>
            <VaButton preset="secondary" style="margin-left: 0.5rem;" @click="handleUse">
                使用该关卡
            </VaButton>
            <VaButton v-if="level.author?.id === userId" preset="secondary" style="margin-left: 0.5rem;"
                :to="`/editLevel/${level.id}`">
                编辑关卡
            </VaButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { axios } from "../utils/axios";
import type { ILevelData, IMarketItem } from '@/stores/game';
import JoinRoomModel from '@/components/joinRoom.vue';
import BackBtn from '@/components/backBtn.vue';
import JsonEditorVue from 'json-editor-vue'
import { useUserStore } from '@/stores/user';
// @ts-ignore
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt()
const route = useRoute();

const marketItems = computed(() => {
    return level.value?.content?.market_data?.reduce(
        (acc: string[], item: { items: IMarketItem[] }) => {
            return [...acc, ...item.items.map((item: IMarketItem) => item.name)]
        }, [] as string[])
})

const isShowRoomModel = ref(false)
const level = ref<ILevelData>({} as ILevelData);
const isLoading = ref(false);
const isLikeLoading = ref(false);
const userId = useUserStore().getSelfId()

const fetchLevel = async () => {
    isLoading.value = true;
    try {
        const result = await axios.get(`/levels/${route.params.id}`);
        if (result.data.success) {
            level.value = result.data.data;
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};

const handleLike = async () => {
    isLikeLoading.value = true;
    try {
        const result = await axios.post(`/levels/${route.params.id}/like`);
        if (result.data.success) {
            level.value = result.data.data;
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLikeLoading.value = false;
    }
};

const handleUse = () => {
    isShowRoomModel.value = true
};

onMounted(() => {
    fetchLevel();
});
</script>

<style scoped>
.level-detail {
    background-color: #fff;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100vh;
}

.title {
    margin-bottom: 1rem;
}

.content {
    white-space: pre-wrap;
    flex: 1;
    overflow-y: auto;
}

.actions {
    display: flex;
    justify-content: flex-end;
}
</style>