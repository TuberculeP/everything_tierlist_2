<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Mon profil</h1>

    <!-- User Info Card -->
    <Card>
      <CardHeader>
        <CardTitle>Informations</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-muted-foreground">Email</label>
          <div class="flex items-center gap-2">
            <p class="text-sm">{{ user?.email }}</p>
            <Badge v-if="user?.googleId" variant="secondary" class="gap-1">
              <svg class="h-3 w-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Badge>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-muted-foreground"
            >Pseudo</label
          >
          <div v-if="!editingPseudo" class="flex items-center gap-2">
            <p class="text-sm">{{ user?.pseudo }}</p>
            <Button variant="ghost" size="icon-sm" @click="startEditPseudo">
              <Pencil class="w-4 h-4" />
            </Button>
          </div>
          <div v-else class="flex items-center gap-2">
            <Input
              v-model="newPseudo"
              class="max-w-xs"
              placeholder="Nouveau pseudo"
              @keyup.enter="savePseudo"
            />
            <Button size="sm" @click="savePseudo" :disabled="savingPseudo">
              {{ savingPseudo ? "..." : "Sauvegarder" }}
            </Button>
            <Button variant="ghost" size="sm" @click="cancelEditPseudo">
              Annuler
            </Button>
          </div>
          <p v-if="pseudoError" class="text-sm text-destructive">
            {{ pseudoError }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- My Items Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Mes items ({{ filteredItems.length }})</span>
          <select
            v-model="itemsRoomFilter"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal"
          >
            <option value="all">Toutes les rooms</option>
            <option value="public">Public uniquement</option>
            <option v-for="room in myRooms" :key="room.id" :value="room.id">
              {{ room.name }}
            </option>
          </select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loadingItems" class="text-sm text-muted-foreground">
          Chargement...
        </div>
        <div
          v-else-if="filteredItems.length === 0"
          class="text-sm text-muted-foreground"
        >
          Aucun item dans cette sélection.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="flex items-center justify-between p-2 rounded-md border"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ item.name }}</span>
              <Badge v-if="item.room" variant="secondary" class="text-xs">
                {{ item.room.name }}
              </Badge>
              <Badge v-else-if="itemsRoomFilter === 'all'" variant="outline" class="text-xs">
                Public
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              @click="confirmDeleteItem(item)"
              class="text-destructive hover:text-destructive"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- My Rooms Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Mes rooms ({{ myRooms.length }})</span>
          <router-link to="/app/rooms/create">
            <Button size="sm">Créer une room</Button>
          </router-link>
        </CardTitle>
        <CardDescription>
          Les rooms vous permettent de créer des tierlists privées partageables via un lien.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loadingRooms" class="text-sm text-muted-foreground">
          Chargement...
        </div>
        <div
          v-else-if="myRooms.length === 0"
          class="text-sm text-muted-foreground"
        >
          Vous n'avez pas encore créé de room.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="room in myRooms"
            :key="room.id"
            class="flex items-center justify-between p-3 rounded-md border"
          >
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ room.name }}</p>
              <p v-if="room.description" class="text-sm text-muted-foreground truncate">
                {{ room.description }}
              </p>
            </div>
            <div class="flex items-center gap-1 ml-2">
              <router-link :to="{ name: 'room-tierlist', params: { hash: room.hash } }">
                <Button variant="ghost" size="icon-sm" title="Ouvrir">
                  <ExternalLink class="w-4 h-4" />
                </Button>
              </router-link>
              <Button
                variant="ghost"
                size="icon-sm"
                @click="confirmDeleteRoom(room)"
                class="text-destructive hover:text-destructive"
                title="Supprimer"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Ignored Items (Trash) Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Trash class="w-5 h-5" />
          <span>Corbeille ({{ ignoredItems.length }})</span>
        </CardTitle>
        <CardDescription>
          Items que vous avez ignores. Vous pouvez les restaurer ou les retirer
          definitivement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loadingIgnored" class="text-sm text-muted-foreground">
          Chargement...
        </div>
        <div
          v-else-if="ignoredItems.length === 0"
          class="text-sm text-muted-foreground"
        >
          Aucun item ignore.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in ignoredItems"
            :key="item.id"
            class="flex items-center justify-between p-2 rounded-md border"
          >
            <span class="text-sm">{{ item.name }}</span>
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                @click="restoreItem(item)"
                title="Restaurer"
              >
                <RotateCcw class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Delete Item Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l'item ?</DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir supprimer "{{ itemToDelete?.name }}" ?
            Cette action est irreversible et supprimera egalement tous les votes
            associes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            Annuler
          </Button>
          <Button
            variant="destructive"
            @click="deleteItem"
            :disabled="deletingItem"
          >
            {{ deletingItem ? "Suppression..." : "Supprimer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Room Confirmation Dialog -->
    <Dialog v-model:open="showDeleteRoomDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la room ?</DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir supprimer "{{ roomToDelete?.name }}" ?
            Cette action est irreversible et supprimera egalement tous les items
            et votes associes a cette room.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteRoomDialog = false">
            Annuler
          </Button>
          <Button
            variant="destructive"
            @click="deleteRoom"
            :disabled="deletingRoom"
          >
            {{ deletingRoom ? "Suppression..." : "Supprimer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/authStore";
import { useRoomStore } from "@/stores/roomStore";
import apiClient from "@/lib/utils/apiClient";
import type { Item, Room } from "@/lib/utils/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash, Trash2, RotateCcw, ExternalLink } from "lucide-vue-next";

const { user } = storeToRefs(useAuthStore());
const roomStore = useRoomStore();

// Pseudo editing
const editingPseudo = ref(false);
const newPseudo = ref("");
const savingPseudo = ref(false);
const pseudoError = ref("");

function startEditPseudo() {
  newPseudo.value = user.value?.pseudo || "";
  editingPseudo.value = true;
  pseudoError.value = "";
}

function cancelEditPseudo() {
  editingPseudo.value = false;
  newPseudo.value = "";
  pseudoError.value = "";
}

async function savePseudo() {
  if (!newPseudo.value.trim()) {
    pseudoError.value = "Le pseudo ne peut pas etre vide";
    return;
  }

  savingPseudo.value = true;
  pseudoError.value = "";

  const result = await apiClient.patch<{ user: typeof user.value }>(
    "/auth/user",
    { pseudo: newPseudo.value.trim() },
  );

  if (result.error) {
    pseudoError.value = "Erreur lors de la mise a jour";
  } else if (result.data?.user) {
    user.value = result.data.user;
    editingPseudo.value = false;
  }

  savingPseudo.value = false;
}

// My items
const myItems = ref<Item[]>([]);
const loadingItems = ref(true);
const itemsRoomFilter = ref<string>("all");

const filteredItems = computed(() => {
  if (itemsRoomFilter.value === "all") {
    return myItems.value;
  }
  if (itemsRoomFilter.value === "public") {
    return myItems.value.filter((item) => !item.roomId);
  }
  return myItems.value.filter((item) => item.roomId === itemsRoomFilter.value);
});

async function fetchMyItems() {
  loadingItems.value = true;
  const result = await apiClient.get<{ items: Item[] }>("/items/my?all=true");
  if (result.data) {
    myItems.value = result.data.items;
  }
  loadingItems.value = false;
}

// Delete item
const showDeleteDialog = ref(false);
const itemToDelete = ref<Item | null>(null);
const deletingItem = ref(false);

function confirmDeleteItem(item: Item) {
  itemToDelete.value = item;
  showDeleteDialog.value = true;
}

async function deleteItem() {
  if (!itemToDelete.value) return;

  deletingItem.value = true;
  const result = await apiClient.delete(`/items/${itemToDelete.value.id}`);

  if (!result.error) {
    myItems.value = myItems.value.filter(
      (i) => i.id !== itemToDelete.value?.id,
    );
    showDeleteDialog.value = false;
  }

  deletingItem.value = false;
  itemToDelete.value = null;
}

// Ignored items
const ignoredItems = ref<Item[]>([]);
const loadingIgnored = ref(true);

async function fetchIgnoredItems() {
  loadingIgnored.value = true;
  const result = await apiClient.get<{ items: Item[] }>("/votes/ignored");
  if (result.data) {
    ignoredItems.value = result.data.items;
  }
  loadingIgnored.value = false;
}

async function restoreItem(item: Item) {
  // Remove the IGNORED vote to restore the item
  const result = await apiClient.delete(`/votes/${item.id}`);
  if (!result.error) {
    ignoredItems.value = ignoredItems.value.filter((i) => i.id !== item.id);
  }
}

// My rooms
const myRooms = ref<Room[]>([]);
const loadingRooms = ref(true);

async function fetchMyRooms() {
  loadingRooms.value = true;
  const result = await apiClient.get<{ rooms: Room[] }>("/rooms/my");
  if (result.data) {
    myRooms.value = result.data.rooms;
    roomStore.setMyRooms(result.data.rooms);
  }
  loadingRooms.value = false;
}

// Delete room
const showDeleteRoomDialog = ref(false);
const roomToDelete = ref<Room | null>(null);
const deletingRoom = ref(false);

function confirmDeleteRoom(room: Room) {
  roomToDelete.value = room;
  showDeleteRoomDialog.value = true;
}

async function deleteRoom() {
  if (!roomToDelete.value) return;

  deletingRoom.value = true;
  const result = await apiClient.delete(`/rooms/${roomToDelete.value.hash}`);

  if (!result.error) {
    myRooms.value = myRooms.value.filter((r) => r.id !== roomToDelete.value?.id);
    roomStore.removeRoom(roomToDelete.value.id);
    showDeleteRoomDialog.value = false;
  }

  deletingRoom.value = false;
  roomToDelete.value = null;
}

onMounted(() => {
  fetchMyItems();
  fetchIgnoredItems();
  fetchMyRooms();
});
</script>
