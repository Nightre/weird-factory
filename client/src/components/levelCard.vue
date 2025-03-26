<template>
    <div class="level-card" @click="handleClick">
        <h1>{{ data.title }} <span class="date">- {{ data.createdAt }}</span></h1>
        <div class="footer">
            <p class="author">作者：{{ data.author.name }}</p>
            <div class="stats">
                <VaIcon name="favorite" :color="data.isLiked ? '#ff5252' : '#888'" />
                <span>{{ data.likes }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ILevelData } from '@/stores/game';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps<{ data: ILevelData }>();

const handleClick = () => {
    router.push(`/level/${props.data.id}`);
};
</script>

<style scoped>
.level-card {
    background-color: #fff;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ccc;
    cursor: pointer;
    transition: all 0.2s ease;
}

.date {
    color: #888;
    font-size: 1rem;
    font-weight: normal;
}

.footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
}

.author {
    color: #888;
    margin: 0;
}

.stats {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: #666;
}
</style>