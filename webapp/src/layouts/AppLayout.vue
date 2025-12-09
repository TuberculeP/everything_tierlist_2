<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header / Navbar -->
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex h-14 max-w-5xl mx-auto px-6 items-center gap-6">
        <!-- Logo -->
        <h1 class="text-lg font-semibold flex items-center gap-2 shrink-0">
          <!-- <img src="/et_logo.png" alt="Everything Tierlist" width="100" /> -->
          Everything Tierlist
          <Badge variant="outline">alpha</Badge>
        </h1>

        <template v-if="isAuthenticated">
          <!-- Navigation -->
          <nav class="flex gap-1">
            <router-link
              v-for="tab in tabs"
              :key="tab.name"
              :to="{ name: tab.name }"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                isActiveTab(tab.name)
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              ]"
            >
              <component :is="tab.icon" class="w-4 h-4 inline-block mr-1.5" />
              {{ tab.label }}
            </router-link>
          </nav>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- User -->
          <div class="flex items-center gap-2 shrink-0">
            <router-link
              :to="{ name: 'app-profile' }"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ user?.pseudo }}
            </router-link>
            <Button variant="ghost" size="icon-sm" @click="disconnect">
              <LogOut class="w-4 h-4" />
            </Button>
          </div>
        </template>
      </div>
    </header>

    <!-- Main content -->
    <main class="mx-auto max-w-5xl px-6 py-8 flex-1 w-full">
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
            >Signaler les bugs (ou proposer des améliorations) !</a
          ><br />
          (Vous pouvez aussi vous amuser à les causer, sous réserve
          d'immédiatement le signaler)
        </p>
      </div>
      <slot />
    </main>

    <!-- Footer -->
    <footer
      class="border-t py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-4"
    >
      <p class="flex items-center justify-center gap-1">
        Made with <Heart class="w-4 h-4 text-red-500 fill-red-500" /> by Félix
      </p>
      <a href="https://ko-fi.com/L3L4NBU2W" target="_blank"
        ><img
          height="36"
          style="border: 0px; height: 36px"
          src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
          border="0"
          alt="Buy Me a Coffee at ko-fi.com"
      /></a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import apiClient from "../lib/utils/apiClient";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge/Badge.vue";
import { ref } from "vue";
import { LayoutGrid, Trophy, LogOut, Heart } from "lucide-vue-next";

const route = useRoute();
const { user, isAuthenticated } = storeToRefs(useAuthStore());

const tabs = [
  { name: "landing-main", label: "Tierlist", icon: LayoutGrid },
  { name: "app-leaderboard", label: "Leaderboard", icon: Trophy },
];

function isActiveTab(tabName: string): boolean {
  return route.name === tabName;
}

async function disconnect() {
  const result = await apiClient.post("/auth/logout");
  if (result.data) {
    user.value = undefined;
    window.location.reload();
  } else {
    console.error("Erreur lors de la deconnexion :", result.error);
  }
}

const alphaActive = ref(true);
</script>
