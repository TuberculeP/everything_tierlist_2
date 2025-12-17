<template>
  <div class="min-h-screen bg-background flex flex-col">
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex h-14 max-w-5xl mx-auto px-6 items-center gap-6">
        <h1 class="text-lg font-semibold flex items-center gap-2 shrink-0">
          Everything Tierlist
          <Badge variant="outline">alpha</Badge>
        </h1>

        <div class="flex-1"></div>

        <div class="flex items-center gap-2">
          <Button variant="ghost" as-child>
            <router-link :to="{ name: 'app-login' }"> Se connecter </router-link>
          </Button>
          <Button as-child>
            <router-link :to="{ name: 'app-register' }">
              S'inscrire
            </router-link>
          </Button>
        </div>
      </div>
    </header>

    <main class="flex-1 flex items-center justify-center relative">
      <FloatingItems />
      <div class="text-center max-w-2xl mx-auto px-6 py-20 relative z-10">
        <h2 class="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Classez <span class="text-primary">tout</span> et
          <span class="text-primary">n'importe quoi</span>
        </h2>
        <p class="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Proposez des items, votez, et découvrez ce que la communauté pense
          vraiment. Du plus S-tier au plus D-tier.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" as-child>
            <router-link :to="{ name: 'app-login' }">
              <LayoutGrid class="w-5 h-5 mr-2" />
              Participer
            </router-link>
          </Button>
          <Button size="lg" variant="outline" as-child>
            <router-link :to="{ name: 'public-leaderboard' }">
              <Trophy class="w-5 h-5 mr-2" />
              Voir le Classement
            </router-link>
          </Button>
        </div>
      </div>
    </main>

    <footer
      class="border-t py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-4 relative z-10"
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
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge/Badge.vue";
import FloatingItems from "@/components/FloatingItems.vue";
import { LayoutGrid, Trophy, Heart } from "lucide-vue-next";
</script>
