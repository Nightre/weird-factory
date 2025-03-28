<template>
    <div style="width: 95%;margin: auto;">
        <VaButton icon-right="arrow_forward" icon-color="#ffffff50" style="margin-bottom: 1rem;margin-top: 2rem;" to="/home">
            返回主页
        </VaButton>
        <div ref="container">
        </div>
        <VaInnerLoading :loading="isLoading" v-if="isLoading" :size="60" style="margin-top: 5rem;"></VaInnerLoading>

    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue"
import { axios } from "../utils/axios"

const container = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
onMounted(() => {
    axios.get("/help").then(res => {
        container.value!.innerHTML = res.data.data
        isLoading.value = false
    })
})

</script>
<style scoped>
h1 {
    margin: 1rem 0rem;
    font-size: 1.5rem;
}

img {
    margin: 1rem 0;
}
</style>