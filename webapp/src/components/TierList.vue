<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import draggable from "vuedraggable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ItemSearch from "@/components/ItemSearch.vue";
import ItemStatsModal from "@/components/ItemStatsModal.vue";
import apiClient from "@/lib/utils/apiClient";
import type { Item } from "@/lib/utils/types";
import { RefreshCw } from "lucide-vue-next";

const props = defineProps<{
  roomId?: string | null;
}>();

// Stats modal state
const selectedItem = ref<Item | null>(null);
const statsModalOpen = ref(false);

function openStatsModal(item: Item) {
  selectedItem.value = item;
  statsModalOpen.value = true;
}

interface Tier {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  items: Item[];
}

interface Vote {
  id: string;
  itemId: string;
  tier: string;
  item: Item;
}

const tiers = ref<Tier[]>([
  {
    id: "s",
    name: "S",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
    items: [],
  },
  {
    id: "a",
    name: "A",
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-200",
    items: [],
  },
  {
    id: "b",
    name: "B",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 border-yellow-200",
    items: [],
  },
  {
    id: "c",
    name: "C",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
    items: [],
  },
  {
    id: "d",
    name: "D",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
    items: [],
  },
]);

const unrankedItems = ref<Item[]>([]);
const ignoredItems = ref<Item[]>([]);
const loadingRecommendations = ref(false);
const userCount = ref<number | null>(null);

// Items already voted on (in tiers or ignored) - these should never reappear
const votedItemIds = computed(() => {
  const ids = new Set<string>();
  ignoredItems.value.forEach((item) => ids.add(item.id));
  tiers.value.forEach((tier) => {
    tier.items.forEach((item) => ids.add(item.id));
  });
  return ids;
});

// All items in use (including unranked) - for search deduplication
const usedItemIds = computed(() => {
  const ids = new Set(votedItemIds.value);
  unrankedItems.value.forEach((item) => ids.add(item.id));
  return ids;
});

function handleAddItem(item: Item) {
  if (usedItemIds.value.has(item.id)) {
    return;
  }
  unrankedItems.value.push(item);
}

function removeFromUnrankedLists(itemId: string) {
  unrankedItems.value = unrankedItems.value.filter((i) => i.id !== itemId);
  ignoredItems.value = ignoredItems.value.filter((i) => i.id !== itemId);
}

async function handleTierChange(
  tierName: string,
  event: { added?: { element: Item } },
) {
  if (event.added) {
    const item = event.added.element;
    removeFromUnrankedLists(item.id);
    await apiClient.post("/votes", {
      itemId: item.id,
      tier: tierName,
      roomId: props.roomId ?? null,
    });
  }
}

async function handleUnrankedChange(event: { added?: { element: Item } }) {
  if (event.added) {
    const item = event.added.element;
    const roomQuery = props.roomId ? `?roomId=${props.roomId}` : "";
    await apiClient.delete(`/votes/${item.id}${roomQuery}`);
  }
}

async function handleIgnoredChange(event: { added?: { element: Item } }) {
  if (event.added) {
    const item = event.added.element;
    removeFromUnrankedLists(item.id);
    // Re-add to ignored list since removeFromUnrankedLists removes it
    if (!ignoredItems.value.find((i) => i.id === item.id)) {
      ignoredItems.value.push(item);
    }
    await apiClient.post("/votes", {
      itemId: item.id,
      tier: "IGNORED",
      roomId: props.roomId ?? null,
    });
  }
}

async function fetchRecommendations() {
  loadingRecommendations.value = true;
  const roomQuery = props.roomId ? `?roomId=${props.roomId}` : "";
  const response = await apiClient.get<{ items: Item[] }>(
    `/items/recommendations${roomQuery}`,
  );
  if (response.data?.items) {
    // Filter out items already voted on (in tiers or ignored)
    const newItems = response.data.items.filter(
      (item) => !votedItemIds.value.has(item.id),
    );
    unrankedItems.value = newItems;
  }
  loadingRecommendations.value = false;
}

async function refreshRecommendations() {
  await fetchRecommendations();
}

onMounted(async () => {
  // Fetch user count (only for public tierlist)
  if (!props.roomId) {
    const statsResponse = await apiClient.get<{ userCount: number }>("/stats");
    if (statsResponse.data) {
      userCount.value = statsResponse.data.userCount;
    }
  }

  // Load existing votes into tiers
  const roomQuery = props.roomId ? `?roomId=${props.roomId}` : "";
  const votesResponse = await apiClient.get<{ votes: Vote[] }>(
    `/votes/my${roomQuery}`,
  );
  if (votesResponse.data?.votes) {
    for (const vote of votesResponse.data.votes) {
      if (vote.tier.toUpperCase() === "IGNORED") {
        if (vote.item) {
          ignoredItems.value.push(vote.item);
        }
        continue;
      }
      const tier = tiers.value.find(
        (t) => t.name.toUpperCase() === vote.tier.toUpperCase(),
      );
      if (tier && vote.item) {
        tier.items.push(vote.item);
      }
    }
  }

  // Load recommendations
  await fetchRecommendations();
});
</script>

<template>
  <div class="flex flex-col gap-8">
    <p v-if="!props.roomId" class="text-muted-foreground leading-relaxed">
      La Everything Tierlist est une tierlist sur laquelle vous devez tout
      trier, sans distinction, les propositions de
      {{ userCount ?? "..." }} utilisateurs.<br />Tous les éléments que vous
      créez seront disponible pour l'intégralité des utilisateurs. Vous pouvez
      ensuite double-cliquer sur un élément pour voir ses statistiques.
    </p>
    <p v-else class="text-muted-foreground leading-relaxed">
      Double-cliquez sur un élément pour voir ses statistiques.
    </p>

    <!-- Search -->
    <ItemSearch :room-id="props.roomId" @add="handleAddItem" />

    <!-- Tier List -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle>Classement</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <div
          v-for="tier in tiers"
          :key="tier.id"
          class="flex items-stretch rounded-md border overflow-hidden"
          :class="tier.bgColor"
        >
          <div
            class="w-16 flex-shrink-0 flex items-center justify-center font-bold text-2xl border-r"
            :class="[tier.color, tier.bgColor]"
          >
            {{ tier.name }}
          </div>
          <draggable
            v-model="tier.items"
            group="tierlist"
            item-key="id"
            class="flex-1 flex flex-wrap gap-2 p-3 min-h-14 bg-white/50"
            ghost-class="dragging-ghost"
            chosen-class="dragging-chosen"
            :delay="100"
            :delay-on-touch-only="true"
            @change="(e: any) => handleTierChange(tier.name, e)"
          >
            <template #item="{ element }">
              <Badge
                variant="secondary"
                class="cursor-grab active:cursor-grabbing px-3 py-1.5 text-sm hover:bg-secondary/80"
                @dblclick="openStatsModal(element)"
              >
                {{ element.name }}
              </Badge>
            </template>
          </draggable>
        </div>
      </CardContent>
    </Card>

    <!-- Items to sort -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-base font-medium">Éléments à classer</h2>
        <Button
          variant="ghost"
          size="sm"
          @click="refreshRecommendations"
          :disabled="loadingRecommendations"
        >
          <RefreshCw
            class="w-4 h-4 mr-1"
            :class="{ 'animate-spin': loadingRecommendations }"
          />
          Actualiser
        </Button>
      </div>
      <div class="flex gap-4">
        <draggable
          v-model="unrankedItems"
          group="tierlist"
          item-key="id"
          class="flex-1 flex flex-wrap gap-2 min-h-14 p-3 border border-dashed rounded-md"
          ghost-class="dragging-ghost"
          chosen-class="dragging-chosen"
          :delay="100"
          :delay-on-touch-only="true"
          @change="handleUnrankedChange"
        >
          <template #item="{ element }">
            <Badge
              variant="outline"
              class="cursor-grab active:cursor-grabbing px-3 py-1.5 text-sm hover:bg-accent"
              @dblclick="openStatsModal(element)"
            >
              {{ element.name }}
            </Badge>
          </template>
        </draggable>

        <!-- Ignored/Trash zone -->
        <draggable
          v-if="unrankedItems.length > 0"
          v-model="ignoredItems"
          :group="{ name: 'tierlist', pull: false }"
          item-key="id"
          class="w-32 shrink-0 min-h-14 p-3 border border-dashed border-gray-300 bg-gray-50/50 rounded-md flex items-center justify-center"
          ghost-class="dragging-ghost"
          chosen-class="dragging-chosen"
          :delay="100"
          :delay-on-touch-only="true"
          @change="handleIgnoredChange"
        >
          <template #header>
            <span class="text-muted-foreground text-sm">🗑️</span>
          </template>
          <template #item="{ element }">
            <span :key="element.id" class="sr-only">{{ element.name }}</span>
          </template>
        </draggable>
      </div>
      <p
        v-if="unrankedItems.length === 0 && !loadingRecommendations"
        class="text-sm text-muted-foreground mt-2"
      >
        Aucun élément à classer. Utilisez la recherche pour en ajouter ou
        cliquez sur Actualiser.
      </p>
    </div>

    <!-- Stats Modal -->
    <ItemStatsModal
      :item="selectedItem"
      :room-id="props.roomId"
      v-model:open="statsModalOpen"
    />
  </div>
</template>

<style>
.dragging-ghost {
  opacity: 0.5;
}

.dragging-chosen {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
