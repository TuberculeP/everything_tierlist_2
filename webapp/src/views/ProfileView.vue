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
          <p class="text-sm">{{ user?.email }}</p>
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
          <span>Mes items ({{ myItems.length }})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loadingItems" class="text-sm text-muted-foreground">
          Chargement...
        </div>
        <div
          v-else-if="myItems.length === 0"
          class="text-sm text-muted-foreground"
        >
          Vous n'avez pas encore cree d'item.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in myItems"
            :key="item.id"
            class="flex items-center justify-between p-2 rounded-md border"
          >
            <span class="text-sm">{{ item.name }}</span>
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

    <!-- Delete Confirmation Dialog -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/lib/utils/apiClient";
import type { Item } from "@/lib/utils/types";
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
import { Pencil, Trash, Trash2, RotateCcw } from "lucide-vue-next";

const { user } = storeToRefs(useAuthStore());

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

async function fetchMyItems() {
  loadingItems.value = true;
  const result = await apiClient.get<{ items: Item[] }>("/items/my");
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

onMounted(() => {
  fetchMyItems();
  fetchIgnoredItems();
});
</script>
