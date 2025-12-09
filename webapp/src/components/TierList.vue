<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import draggable from "vuedraggable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ItemSearch from "@/components/ItemSearch.vue";
import ItemStatsModal from "@/components/ItemStatsModal.vue";
import apiClient from "@/lib/utils/apiClient";
import type { Item } from "@/lib/utils/types";

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
const myUnvotedItems = ref<Item[]>([]);
const recommendations = ref<Item[]>([]);

// Get all items currently in use (in tiers or any unranked section)
const usedItemIds = computed(() => {
  const ids = new Set<string>();
  unrankedItems.value.forEach((item) => ids.add(item.id));
  myUnvotedItems.value.forEach((item) => ids.add(item.id));
  recommendations.value.forEach((item) => ids.add(item.id));
  tiers.value.forEach((tier) => {
    tier.items.forEach((item) => ids.add(item.id));
  });
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
  myUnvotedItems.value = myUnvotedItems.value.filter((i) => i.id !== itemId);
  recommendations.value = recommendations.value.filter((i) => i.id !== itemId);
}

async function handleTierChange(tierName: string, event: { added?: { element: Item } }) {
  if (event.added) {
    const item = event.added.element;
    removeFromUnrankedLists(item.id);
    await apiClient.post("/votes", {
      itemId: item.id,
      tier: tierName,
    });
  }
}

async function handleUnrankedChange(event: { added?: { element: Item } }) {
  if (event.added) {
    const item = event.added.element;
    await apiClient.delete(`/votes/${item.id}`);
  }
}

onMounted(async () => {
  const votesResponse = await apiClient.get<{ votes: Vote[] }>("/votes/my");
  if (votesResponse.data?.votes) {
    for (const vote of votesResponse.data.votes) {
      const tier = tiers.value.find(
        (t) => t.name.toUpperCase() === vote.tier.toUpperCase()
      );
      if (tier && vote.item) {
        tier.items.push(vote.item);
      }
    }
  }

  const myUnvotedResponse = await apiClient.get<{ items: Item[] }>("/items/my-unvoted");
  if (myUnvotedResponse.data?.items) {
    myUnvotedItems.value = myUnvotedResponse.data.items;
  }

  const recommendationsResponse = await apiClient.get<{ items: Item[] }>("/items/recommendations");
  if (recommendationsResponse.data?.items) {
    recommendations.value = recommendationsResponse.data.items;
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Search -->
    <ItemSearch @add="handleAddItem" />

    <!-- Tier List -->
    <Card>
      <CardHeader class="pb-4">
        <CardTitle>Classement</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
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

    <!-- My unvoted items -->
    <Card v-if="myUnvotedItems.length > 0">
      <CardHeader class="pb-4">
        <CardTitle class="text-base">Mes créations à trier</CardTitle>
      </CardHeader>
      <CardContent>
        <draggable
          v-model="myUnvotedItems"
          group="tierlist"
          item-key="id"
          class="flex flex-wrap gap-2 min-h-14 p-3 border border-dashed border-orange-200 bg-orange-50/50 rounded-md"
          ghost-class="dragging-ghost"
          chosen-class="dragging-chosen"
          :delay="100"
          :delay-on-touch-only="true"
          @change="handleUnrankedChange"
        >
          <template #item="{ element }">
            <Badge
              variant="outline"
              class="cursor-grab active:cursor-grabbing px-3 py-1.5 text-sm hover:bg-orange-100 border-orange-200"
              @dblclick="openStatsModal(element)"
            >
              {{ element.name }}
            </Badge>
          </template>
        </draggable>
      </CardContent>
    </Card>

    <!-- Recommendations -->
    <Card v-if="recommendations.length > 0">
      <CardHeader class="pb-4">
        <CardTitle class="text-base">Recommandations</CardTitle>
      </CardHeader>
      <CardContent>
        <draggable
          v-model="recommendations"
          group="tierlist"
          item-key="id"
          class="flex flex-wrap gap-2 min-h-14 p-3 border border-dashed border-purple-200 bg-purple-50/50 rounded-md"
          ghost-class="dragging-ghost"
          chosen-class="dragging-chosen"
          :delay="100"
          :delay-on-touch-only="true"
          @change="handleUnrankedChange"
        >
          <template #item="{ element }">
            <Badge
              variant="outline"
              class="cursor-grab active:cursor-grabbing px-3 py-1.5 text-sm hover:bg-purple-100 border-purple-200"
              @dblclick="openStatsModal(element)"
            >
              {{ element.name }}
            </Badge>
          </template>
        </draggable>
      </CardContent>
    </Card>

    <!-- Manually added items -->
    <Card v-if="unrankedItems.length > 0">
      <CardHeader class="pb-4">
        <CardTitle class="text-base">Éléments à classer</CardTitle>
      </CardHeader>
      <CardContent>
        <draggable
          v-model="unrankedItems"
          group="tierlist"
          item-key="id"
          class="flex flex-wrap gap-2 min-h-14 p-3 border border-dashed rounded-md"
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
      </CardContent>
    </Card>

    <!-- Stats Modal -->
    <ItemStatsModal
      :item="selectedItem"
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
