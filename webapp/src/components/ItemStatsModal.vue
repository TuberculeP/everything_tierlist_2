<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import apiClient from "@/lib/utils/apiClient";
import type { Item } from "@/lib/utils/types";

const props = defineProps<{
  item: Item | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

interface VoteStats {
  itemId: string;
  totalVotes: number;
  tiers: Record<string, number>;
}

const stats = ref<VoteStats | null>(null);
const isLoading = ref(false);

const tierColors: Record<string, string> = {
  S: "#dc2626", // red-600
  A: "#ea580c", // orange-600
  B: "#ca8a04", // yellow-600
  C: "#16a34a", // green-600
  D: "#2563eb", // blue-600
};

const tierLabels: Record<string, string> = {
  S: "S - Excellent",
  A: "A - Très bien",
  B: "B - Bien",
  C: "C - Moyen",
  D: "D - Mauvais",
};

// Count of votes excluding IGNORED
const actualVotes = computed(() => {
  if (!stats.value) return 0;
  return ["S", "A", "B", "C", "D"].reduce(
    (sum, tier) => sum + (stats.value!.tiers[tier] || 0),
    0,
  );
});

const ignoredCount = computed(() => {
  return stats.value?.tiers["IGNORED"] || 0;
});

// Generate pie chart gradient (excluding IGNORED)
const pieChartStyle = computed(() => {
  if (!stats.value || actualVotes.value === 0) {
    return { background: "#e5e7eb" }; // gray-200
  }

  const tiers = ["S", "A", "B", "C", "D"];
  const segments: string[] = [];
  let currentPercent = 0;

  for (const tier of tiers) {
    const count = stats.value.tiers[tier] || 0;
    const percent = (count / actualVotes.value) * 100;
    if (percent > 0) {
      segments.push(
        `${tierColors[tier]} ${currentPercent}% ${currentPercent + percent}%`,
      );
      currentPercent += percent;
    }
  }

  if (segments.length === 0) {
    return { background: "#e5e7eb" };
  }

  return {
    background: `conic-gradient(${segments.join(", ")})`,
  };
});

// Load stats when item changes
watch(
  () => props.item,
  async (newItem) => {
    if (newItem) {
      isLoading.value = true;
      const response = await apiClient.get<VoteStats>(
        `/votes/stats/${newItem.id}`,
      );
      if (response.data) {
        stats.value = response.data;
      }
      isLoading.value = false;
    }
  },
  { immediate: true },
);

function handleOpenChange(value: boolean) {
  emit("update:open", value);
  if (!value) {
    stats.value = null;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ item?.name }}</DialogTitle>
        <DialogDescription>Statistiques des votes</DialogDescription>
      </DialogHeader>

      <div v-if="isLoading" class="py-8 text-center text-muted-foreground">
        Chargement...
      </div>

      <div v-else-if="stats" class="space-y-6">
        <!-- Pie Chart -->
        <div class="flex justify-center">
          <div class="w-40 h-40 rounded-full" :style="pieChartStyle" />
        </div>

        <!-- Total votes -->
        <div class="text-center">
          <span class="text-2xl font-bold">{{ actualVotes }}</span>
          <span class="text-muted-foreground ml-2">
            vote{{ actualVotes > 1 ? "s" : "" }}
          </span>
        </div>

        <!-- Ignored count -->
        <p
          v-if="ignoredCount > 0"
          class="text-center text-sm text-muted-foreground"
        >
          {{ ignoredCount }} utilisateur{{ ignoredCount > 1 ? "s ont" : " a" }}
          refusé de voter
        </p>

        <!-- Legend / Breakdown -->
        <div class="space-y-2">
          <div
            v-for="tier in ['S', 'A', 'B', 'C', 'D']"
            :key="tier"
            class="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: tierColors[tier] }"
              />
              <span class="font-medium">{{ tierLabels[tier] }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold">{{ stats.tiers[tier] || 0 }}</span>
              <span class="text-muted-foreground text-sm">
                ({{
                  actualVotes > 0
                    ? Math.round(((stats.tiers[tier] || 0) / actualVotes) * 100)
                    : 0
                }}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center text-muted-foreground">
        Aucune statistique disponible
      </div>
    </DialogContent>
  </Dialog>
</template>
