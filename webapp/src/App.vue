<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "./layouts/AppLayout.vue";
import PublicLayout from "./layouts/PublicLayout.vue";
import { onSocketConnected } from "./lib/utils/websocket";

onSocketConnected((socket) => {
  socket.emit("test", { message: "Hello from Vue!" });
});

const route = useRoute();

const publicLayoutRoutes = ["public-leaderboard"];
const noLayoutRoutes = ["landing", "app-login", "app-register"];

const layoutType = computed(() => {
  if (noLayoutRoutes.includes(route.name as string)) return "none";
  if (publicLayoutRoutes.includes(route.name as string)) return "public";
  return "app";
});
</script>

<template>
  <AppLayout v-if="layoutType === 'app'">
    <RouterView />
  </AppLayout>
  <PublicLayout v-else-if="layoutType === 'public'">
    <RouterView />
  </PublicLayout>
  <RouterView v-else />
</template>
