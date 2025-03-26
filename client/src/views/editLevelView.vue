<template>
    <CreateLevelView :edit="true" :levelId="levelId" />
</template>
<script setup lang="ts">
import CreateLevelView from '@/views/createLevelView.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const levelId = route.params.id as string;
</script>
