<template>
  <div class="min-h-screen bg-background flex flex-col">
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex h-14 max-w-5xl mx-auto px-6 items-center gap-6">
        <router-link
          :to="{ name: isAuthenticated ? 'landing-main' : 'landing' }"
          class="text-lg font-semibold flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
        >
          Everything Tierlist
          <Badge variant="outline">alpha</Badge>
        </router-link>

        <nav class="flex gap-1">
          <router-link
            :to="{ name: isAuthenticated ? 'landing-main' : 'landing' }"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              !isLeaderboard
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            ]"
          >
            <LayoutGrid class="w-4 h-4 inline-block mr-1.5" />
            Tierlist
          </router-link>
          <router-link
            :to="{ name: 'public-leaderboard' }"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              isLeaderboard
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            ]"
          >
            <Trophy class="w-4 h-4 inline-block mr-1.5" />
            Classement
          </router-link>
        </nav>

        <div class="flex-1"></div>

        <template v-if="isAuthenticated">
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
        <template v-else>
          <div class="flex items-center gap-2">
            <Button variant="ghost" as-child>
              <router-link :to="{ name: 'app-login' }">
                Se connecter
              </router-link>
            </Button>
            <Button as-child>
              <router-link :to="{ name: 'app-register' }">
                S'inscrire
              </router-link>
            </Button>
          </div>
        </template>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-8 flex-1 w-full">
      <slot />
    </main>

    <footer
      class="border-t py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-4"
    >
      <p class="flex items-center justify-center gap-1">
        Made with <Heart class="w-4 h-4 text-red-500 fill-red-500" /> by Félix
      </p>
      <a href="https://ko-fi.com/L3L4NBU2W" target="_blank">
        <img
          height="36"
          style="border: 0px; height: 36px"
          src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
          border="0"
          alt="Buy Me a Coffee at ko-fi.com"
        />
      </a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/lib/utils/apiClient";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge/Badge.vue";
import { LayoutGrid, Trophy, LogOut, Heart } from "lucide-vue-next";

const route = useRoute();
const { user, isAuthenticated } = storeToRefs(useAuthStore());

const isLeaderboard = computed(() => route.name === "public-leaderboard");

async function disconnect() {
  const result = await apiClient.post("/auth/logout");
  if (result.data) {
    user.value = undefined;
    window.location.reload();
  }
}
</script>
