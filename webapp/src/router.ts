import { createRouter, createWebHistory } from "vue-router";

import LoginView from "./views/auth/LoginView.vue";
import RegisterView from "./views/auth/RegisterView.vue";
import ProfileView from "./views/ProfileView.vue";
import LeaderboardView from "./views/LeaderboardView.vue";
import CreateRoomView from "./views/CreateRoomView.vue";
import RoomView from "./views/RoomView.vue";
import RoomLeaderboardView from "./views/RoomLeaderboardView.vue";

import { useAuthStore } from "./stores/authStore";
import apiClient from "./lib/utils/apiClient";
import type { User } from "./lib/utils/types";
import Main from "./views/Main.vue";

async function authGuard(to: any, _from: any, next: any) {
  const authStore = useAuthStore();
  const check = await apiClient.get<{ user: User }>("/auth/check");
  if (check.error) {
    next({ name: "app-login", query: { redirect: to.name } });
    return;
  }
  if (check.data && check.data.user) {
    authStore.user = check.data.user;
    next();
  } else {
    next({ name: "app-login", query: { redirect: to.name } });
  }
}

const routes = [
  { path: "/", redirect: "/app", name: "home-redirect" },
  { path: "/app", component: Main, name: "landing-main" },
  { path: "/app/profile", component: ProfileView, name: "app-profile" },
  {
    path: "/app/leaderboard",
    component: LeaderboardView,
    name: "app-leaderboard",
  },
  {
    path: "/app/rooms/create",
    component: CreateRoomView,
    name: "create-room",
  },
  {
    path: "/app/room/:hash",
    component: RoomView,
    name: "room-tierlist",
  },
  {
    path: "/app/room/:hash/leaderboard",
    component: RoomLeaderboardView,
    name: "room-leaderboard",
  },
  { path: "/login", component: LoginView, name: "app-login" },
  { path: "/register", component: RegisterView, name: "app-register" },
];

const getGuardedRoutes = () => {
  const guardedMatches = ["app"];
  return routes.map((route) => {
    if (guardedMatches.some((match) => route.path.includes(match))) {
      return {
        ...route,
        beforeEnter: authGuard,
      };
    }
    return route;
  });
};

export const router = createRouter({
  history: createWebHistory(),
  routes: getGuardedRoutes(),
});
