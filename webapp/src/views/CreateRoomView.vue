<template>
  <div class="max-w-xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Créer une Room</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium mb-1">
          Nom de la room *
        </label>
        <input
          id="name"
          v-model="name"
          type="text"
          maxlength="100"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ma super tierlist"
        />
        <p class="text-xs text-gray-500 mt-1">{{ name.length }}/100</p>
      </div>

      <div>
        <label for="description" class="block text-sm font-medium mb-1">
          Description (optionnelle)
        </label>
        <textarea
          id="description"
          v-model="description"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Décris ta room..."
        ></textarea>
      </div>

      <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

      <button
        type="submit"
        :disabled="isLoading || !name.trim()"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isLoading ? "Création..." : "Créer la room" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/lib/utils/apiClient";
import type { Room } from "@/lib/utils/types";
import { useRoomStore } from "@/stores/roomStore";

const router = useRouter();
const roomStore = useRoomStore();

const name = ref("");
const description = ref("");
const isLoading = ref(false);
const error = ref("");

async function handleSubmit() {
  if (!name.value.trim()) return;

  isLoading.value = true;
  error.value = "";

  const response = await apiClient.post<{ room: Room }>("/rooms", {
    name: name.value.trim(),
    description: description.value.trim() || null,
  });

  isLoading.value = false;

  if (response.error) {
    error.value = response.error.message || "Erreur lors de la création";
    return;
  }

  if (response.data?.room) {
    roomStore.addRoom(response.data.room);
    router.push({
      name: "room-tierlist",
      params: { hash: response.data.room.hash },
    });
  }
}
</script>
