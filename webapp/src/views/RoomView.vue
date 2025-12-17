<template>
  <div v-if="isLoading" class="flex justify-center items-center py-20">
    <div class="text-gray-500">Chargement...</div>
  </div>

  <div v-else-if="error" class="flex flex-col items-center py-20">
    <div class="text-red-500 mb-4">{{ error }}</div>
    <router-link to="/app" class="text-blue-600 hover:underline">
      Retour à la tierlist publique
    </router-link>
  </div>

  <div v-else-if="room">
    <div class="bg-gray-100 border-b px-4 py-3 mb-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">{{ room.name }}</h1>
          <p v-if="room.description" class="text-sm text-gray-600 mt-1">
            {{ room.description }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Créé par {{ room.creatorPseudo }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="copyLink"
            class="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            {{ copied ? "Copié !" : "Copier le lien" }}
          </button>
          <router-link
            :to="{ name: 'room-leaderboard', params: { hash: room.hash } }"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Leaderboard
          </router-link>
        </div>
      </div>
    </div>

    <TierList :room-id="room.id" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import apiClient from "@/lib/utils/apiClient";
import type { Room } from "@/lib/utils/types";
import { useRoomStore } from "@/stores/roomStore";
import TierList from "@/components/TierList.vue";

const route = useRoute();
const roomStore = useRoomStore();

const room = ref<Room | null>(null);
const isLoading = ref(true);
const error = ref("");
const copied = ref(false);

async function fetchRoom() {
  const hash = route.params.hash as string;
  isLoading.value = true;
  error.value = "";

  const response = await apiClient.get<{ room: Room }>(`/rooms/${hash}`);

  isLoading.value = false;

  if (response.error) {
    error.value = "Room non trouvée";
    return;
  }

  if (response.data?.room) {
    room.value = response.data.room;
    roomStore.setCurrentRoom(response.data.room);
  }
}

async function copyLink() {
  const url = window.location.href;
  await navigator.clipboard.writeText(url);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

onMounted(() => {
  fetchRoom();
});

onUnmounted(() => {
  roomStore.clearRoom();
});
</script>
