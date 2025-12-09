<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/utils/apiClient";
import type { Item } from "@/lib/utils/types";

const emit = defineEmits<{
  (e: "add", item: Item): void;
}>();

const searchQuery = ref("");
const suggestions = ref<Item[]>([]);
const isLoading = ref(false);
const error = ref("");

const fetchSuggestions = useDebounceFn(async (query: string) => {
  isLoading.value = true;
  error.value = "";

  const response = await apiClient.get<{ items: Item[] }>(
    `/items?q=${encodeURIComponent(query)}`,
  );

  if (response.error) {
    error.value = "Erreur lors de la recherche";
  } else if (response.data) {
    suggestions.value = response.data.items;
  }

  isLoading.value = false;
}, 300);

watch(searchQuery, (newQuery) => {
  fetchSuggestions(newQuery);
});

fetchSuggestions("");

async function createItem() {
  if (!searchQuery.value.trim()) return;

  isLoading.value = true;
  error.value = "";

  const response = await apiClient.post<{ item: Item; error?: string }>(
    "/items",
    {
      name: searchQuery.value.trim(),
    },
  );

  if (response.error) {
    error.value =
      response.error.response?.data?.error || "Erreur lors de la création";
  } else if (response.data?.item) {
    emit("add", response.data.item);
    searchQuery.value = "";
    fetchSuggestions("");
  }

  isLoading.value = false;
}

function addExistingItem(item: Item) {
  emit("add", item);
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex gap-3">
      <Input
        v-model="searchQuery"
        placeholder="Rechercher ou créer un élément..."
        class="flex-1"
        @keyup.enter="createItem"
      />
      <Button @click="createItem" :disabled="!searchQuery.trim() || isLoading">
        Ajouter
      </Button>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="isLoading" class="text-sm text-muted-foreground">
      Chargement...
    </div>

    <p
      v-else-if="searchQuery && !isLoading"
      class="text-sm text-muted-foreground"
    >
      Aucun résultat. Cliquez sur "Ajouter" pour créer "{{ searchQuery }}".
    </p>
  </div>
</template>
