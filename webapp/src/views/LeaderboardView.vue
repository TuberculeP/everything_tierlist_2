<template>
  <div class="space-y-6">
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
                <TableCell>{{ item.name }}</TableCell>
                <TableCell class="text-right">
                  <Badge :variant="getScoreVariant(item.score)">
                    {{ item.score > 0 ? "+" : "" }}{{ item.score }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right text-muted-foreground">
                  {{ item.voteCount }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <!-- Pagination -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
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
} from "lucide-vue-next";

interface LeaderboardItem {
  id: string;
  name: string;
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

const items = ref<LeaderboardItem[]>([]);
const loading = ref(true);
const sortOrder = ref<"asc" | "desc">("desc");
const page = ref(1);
const limit = ref(20);
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
});

async function fetchLeaderboard() {
  loading.value = true;
  const result = await apiClient.get<LeaderboardResponse>(
    `/items/leaderboard?order=${sortOrder.value}&page=${page.value}&limit=${limit.value}`,
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
  score: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (score > 0) return "default";
  if (score < 0) return "destructive";
  return "secondary";
}

onMounted(() => {
  fetchLeaderboard();
});
</script>
