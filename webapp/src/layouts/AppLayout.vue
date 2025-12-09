<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 max-w-screen-xl items-center justify-between px-4 mx-auto">
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-semibold">Tier List de Tout</h1>
        </div>

        <div v-if="isAuthenticated" class="flex items-center gap-4">
          <span class="text-sm text-muted-foreground">
            {{ user?.firstName }}
          </span>
          <Button variant="outline" size="sm" @click="disconnect">
            Déconnexion
          </Button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="container max-w-screen-xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../lib/utils/apiClient";
import { Button } from "@/components/ui/button";

const { user, isAuthenticated } = storeToRefs(useAuthStore());

async function disconnect() {
  const result = await apiClient.post("/auth/logout");
  if (result.data) {
    user.value = undefined;
    window.location.reload();
  } else {
    console.error("Erreur lors de la déconnexion :", result.error);
  }
}
</script>
