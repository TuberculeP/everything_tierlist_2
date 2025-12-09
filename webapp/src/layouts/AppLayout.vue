<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div
        class="flex h-14 max-w-5xl items-center justify-between px-6 mx-auto"
      >
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-semibold flex items-center gap-2">
            Everything Tierlist <Badge variant="outline">alpha</Badge>
          </h1>
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
    <main class="mx-auto max-w-5xl px-6 py-8">
      <!-- zone d'info de la version alpha-->
      <div
        v-if="alphaActive"
        class="bg-yellow-100 text-yellow-900 text-sm py-2 px-4 mb-6 rounded-md border border-yellow-200 relative"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          class="absolute top-2 right-2 text-yellow-900 hover:bg-yellow-200"
          @click="alphaActive = false"
        >
          x
        </Button>
        <p>
          ⚠️ Vous utilisez une version alpha de Everything Tierlist. Certaines
          fonctionnalités peuvent être manquantes ou instables. <br />
          N'hésitez pas à
          <a
            href="https://github.com/TuberculeP/everything_tierlist_2/issues/new"
            class="underline hover:text-red-700"
            >Signaler les bugs !</a
          ><br />
          (Vous pouvez aussi vous amuser à les causer, sous réserve
          d'immédiatement le signaler)
        </p>
      </div>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../lib/utils/apiClient";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge/Badge.vue";
import { ref } from "vue";

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

const alphaActive = ref(true);
</script>
