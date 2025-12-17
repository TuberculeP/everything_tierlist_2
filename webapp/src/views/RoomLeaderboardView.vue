<template>
  <div v-if="roomLoading" class="flex justify-center items-center py-20">
    <div class="text-gray-500">Chargement...</div>
  </div>

  <div v-else-if="roomError" class="flex flex-col items-center py-20">
    <div class="text-red-500 mb-4">{{ roomError }}</div>
    <router-link to="/app" class="text-blue-600 hover:underline">
      Retour à la tierlist publique
    </router-link>
  </div>

  <div v-else-if="room" class="space-y-6">
    <div class="bg-gray-100 border-b px-4 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">{{ room.name }} - Leaderboard</h1>
          <p v-if="room.description" class="text-sm text-gray-600 mt-1">
            {{ room.description }}
          </p>
        </div>
        <div class="flex gap-2">
          <router-link
            :to="{ name: 'room-tierlist', params: { hash: room.hash } }"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tierlist
          </router-link>
        </div>
      </div>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Classement des items</CardTitle>
          <div class="flex items-center gap-2">
            <select
              v-model="limit"
              class="h-9 rounded-md border border-input bg-background px-3 text-sm"
              @change="onLimitChange"
            >
              <option :value="10">10 par page</option>
              <option :value="20">20 par page</option>
              <option :value="50">50 par page</option>
              <option :value="100">100 par page</option>
            </select>
            <Button variant="outline" size="sm" @click="toggleOrder">
              <ArrowUpDown class="w-4 h-4 mr-2" />
              {{ sortOrder === "desc" ? "Meilleurs" : "Pires" }}
            </Button>
          </div>
        </div>
        <CardDescription>
          Score : S (+3), A (+2), B (+1), C (-1), D (-2)
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div
          v-if="loading"
          class="text-sm text-muted-foreground py-8 text-center"
        >
          Chargement...
        </div>
        <div
          v-else-if="items.length === 0"
          class="text-sm text-muted-foreground py-8 text-center"
        >
          Aucun item pour le moment.
        </div>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-16">#</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead class="text-right w-24">Score</TableHead>
                <TableHead class="text-right w-24">Votes</TableHead>
                <TableHead class="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(item, index) in items" :key="item.id">
                <TableCell class="font-medium">
                  <span
                    :class="{
                      'text-yellow-500': getRank(index) === 1,
                      'text-gray-400': getRank(index) === 2,
                      'text-amber-600': getRank(index) === 3,
                    }"
                  >
                    {{ getRank(index) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span class="flex items-center gap-1.5">
                    {{ item.name }}
                    <span
                      v-if="item.userId === user?.id"
                      class="group relative inline-flex"
                    >
                      <UserRound class="w-3.5 h-3.5 text-muted-foreground" />
                      <span
                        class="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-xs rounded bg-popover border shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        L'une de vos propositions
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell class="text-right">
                  <Badge :variant="getScoreVariant(item.score)">
                    {{ item.score > 0 ? "+" : "" }}{{ item.score }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right text-muted-foreground">
                  {{ item.voteCount }}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    @click="openStatsModal(item)"
                    title="Voir les statistiques"
                  >
                    <BarChart3 class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div
            class="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground"
          >
            <div>{{ pagination.total }} items au total</div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="page <= 1"
                @click="goToPage(1)"
              >
                <ChevronsLeft class="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
              >
                <ChevronLeft class="w-4 h-4" />
              </Button>
              <span class="px-2">
                Page {{ page }} / {{ pagination.totalPages }}
              </span>
              <Button
                variant="outline"
                size="sm"
                :disabled="page >= pagination.totalPages"
                @click="goToPage(page + 1)"
              >
                <ChevronRight class="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="page >= pagination.totalPages"
                @click="goToPage(pagination.totalPages)"
              >
                <ChevronsRight class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <ItemStatsModal
      :item="selectedItem"
      :room-id="room.id"
      v-model:open="statsModalOpen"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/authStore";
import { useRoomStore } from "@/stores/roomStore";
import apiClient from "@/lib/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  UserRound,
} from "lucide-vue-next";
import ItemStatsModal from "@/components/ItemStatsModal.vue";
import type { Item, Room } from "@/lib/utils/types";

interface LeaderboardItem {
  id: string;
  name: string;
  userId: string;
  score: number;
  voteCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LeaderboardResponse {
  items: LeaderboardItem[];
  pagination: Pagination;
}

const route = useRoute();
const { user } = storeToRefs(useAuthStore());
const roomStore = useRoomStore();

const room = ref<Room | null>(null);
const roomLoading = ref(true);
const roomError = ref("");

const items = ref<LeaderboardItem[]>([]);
const loading = ref(true);
const sortOrder = ref<"asc" | "desc">("desc");
const page = ref(1);
const limit = ref(20);

const selectedItem = ref<Item | null>(null);
const statsModalOpen = ref(false);

function openStatsModal(item: LeaderboardItem) {
  selectedItem.value = { id: item.id, name: item.name } as Item;
  statsModalOpen.value = true;
}

const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
});

async function fetchRoom() {
  const hash = route.params.hash as string;
  roomLoading.value = true;
  roomError.value = "";

  const response = await apiClient.get<{ room: Room }>(`/rooms/${hash}`);

  roomLoading.value = false;

  if (response.error) {
    roomError.value = "Room non trouvée";
    return;
  }

  if (response.data?.room) {
    room.value = response.data.room;
    roomStore.setCurrentRoom(response.data.room);
    fetchLeaderboard();
  }
}

async function fetchLeaderboard() {
  if (!room.value) return;

  loading.value = true;
  const result = await apiClient.get<LeaderboardResponse>(
    `/items/leaderboard?order=${sortOrder.value}&page=${page.value}&limit=${limit.value}&roomId=${room.value.id}`
  );
  if (result.data) {
    items.value = result.data.items;
    pagination.value = result.data.pagination;
  }
  loading.value = false;
}

function toggleOrder() {
  sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
  page.value = 1;
  fetchLeaderboard();
}

function goToPage(newPage: number) {
  page.value = newPage;
  fetchLeaderboard();
}

function onLimitChange() {
  page.value = 1;
  fetchLeaderboard();
}

function getRank(index: number): number {
  const baseRank = (page.value - 1) * limit.value;
  if (sortOrder.value === "desc") {
    return baseRank + index + 1;
  }
  return pagination.value.total - baseRank - index;
}

function getScoreVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score > 0) return "default";
  if (score < 0) return "destructive";
  return "secondary";
}

onMounted(() => {
  fetchRoom();
});

onUnmounted(() => {
  roomStore.clearRoom();
});
</script>
