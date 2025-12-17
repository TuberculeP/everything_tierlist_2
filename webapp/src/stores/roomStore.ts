import { defineStore } from "pinia";
import type { Room } from "../lib/utils/types";
import { ref, computed } from "vue";

export const useRoomStore = defineStore("roomStore", () => {
  const currentRoom = ref<Room | null>(null);
  const myRooms = ref<Room[]>([]);

  const isInRoom = computed(() => currentRoom.value !== null);
  const currentRoomId = computed(() => currentRoom.value?.id ?? null);
  const currentRoomHash = computed(() => currentRoom.value?.hash ?? null);

  function setCurrentRoom(room: Room | null) {
    currentRoom.value = room;
  }

  function setMyRooms(rooms: Room[]) {
    myRooms.value = rooms;
  }

  function clearRoom() {
    currentRoom.value = null;
  }

  function addRoom(room: Room) {
    myRooms.value = [room, ...myRooms.value];
  }

  function removeRoom(roomId: string) {
    myRooms.value = myRooms.value.filter((r) => r.id !== roomId);
  }

  return {
    currentRoom,
    myRooms,
    isInRoom,
    currentRoomId,
    currentRoomHash,
    setCurrentRoom,
    setMyRooms,
    clearRoom,
    addRoom,
    removeRoom,
  };
});
