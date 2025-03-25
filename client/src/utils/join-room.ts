import { useGameStore, type IRoomCreateOptions } from "@/stores/game";
import { useRoute, useRouter } from "vue-router";
import router from "@/router";

export const useJoinRoom = () => {
  const store = useGameStore();

  const joinRoom = (options: IRoomCreateOptions) => {
    store.gameCreateData.public = options.public;
    store.gameCreateData.create = options.create;
    store.gameCreateData.roomId = options.roomId;

    router.push({
      name: "Game", query: { roomId: options.roomId }
    });
  };

  const loadFromQuery = (roomId?: string) => {
    const route = useRoute()
    if (roomId) {
      store.gameCreateData.roomId = roomId
    } else if (route.query.roomId) {
      store.gameCreateData.roomId = route.query.roomId as string
    }
  }
  
  return { joinRoom, loadFromQuery };
};

