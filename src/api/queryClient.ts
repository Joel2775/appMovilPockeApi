import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
  onlineManager,
  QueryClient,
} from '@tanstack/react-query';

import {
  createFavorite,
  createNote,
  deleteFavorite,
  deleteNote,
  updateNote,
} from './mockApi';
import { queryKeys } from './queryKeys';
import type {
  Favorite,
  FavoriteInput,
  Note,
  NoteInput,
  UpdateNoteInput,
} from './types';

const DAY = 24 * 60 * 60 * 1000;
const FAVORITES_KEY = queryKeys.favorites.list();
const NOTES_KEY = queryKeys.notes.list();

type FavoriteContext = { previous: Favorite[] | undefined };
type NoteContext = { previous: Note[] | undefined };

function logSyncEvent(
  event: string,
  details: Record<string, string | number | undefined> = {},
) {
  const now = new Date();
  console.info(`[offline-sync] ${event}`, {
    dateTime: now.toLocaleString(),
    timestamp: now.toISOString(),
    ...details,
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: DAY,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      gcTime: DAY,
      networkMode: 'online',
      retry: 2,
    },
  },
});

export const queryCacheMaxAge = DAY;

onlineManager.setEventListener((setOnline) =>
  (() => {
    let wasOnline: boolean | undefined;

    return NetInfo.addEventListener((state) => {
      const isOnline =
        state.isConnected === true && state.isInternetReachable !== false;
      if (wasOnline === false && isOnline) {
        logSyncEvent('Conexión restaurada; reanudando mutaciones pendientes');
      }
      wasOnline = isOnline;
      setOnline(isOnline);
    });
  })(),
);

queryClient.setQueryDefaults(queryKeys.pokemon.all, {
  staleTime: 12 * 60 * 60 * 1000,
});
queryClient.setQueryDefaults(queryKeys.favorites.all, { staleTime: 60 * 1000 });
queryClient.setQueryDefaults(queryKeys.notes.all, { staleTime: 60 * 1000 });

queryClient.setMutationDefaults<Favorite, Error, FavoriteInput, FavoriteContext>(
  queryKeys.favorites.mutations.create,
  {
    mutationFn: createFavorite,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<Favorite[]>(FAVORITES_KEY);
      queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) => [
        ...current,
        {
          ...input,
          id: `pending-${Date.now()}`,
          pending: true,
        },
      ]);
      logSyncEvent('Favorito guardado en caché', {
        pokemonId: input.pokemonId,
        status: 'pending',
      });
      return { previous };
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) => [
        ...current.filter(
          (favorite) => favorite.pokemonId !== saved.pokemonId || !favorite.pending,
        ),
        saved,
      ]);
      logSyncEvent('Favorito sincronizado con MockAPI', {
        id: saved.id,
        pokemonId: saved.pokemonId,
        createdAt: saved.createdAt,
      });
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      } else {
        queryClient.removeQueries({ queryKey: FAVORITES_KEY, exact: true });
      }
      logSyncEvent('Error al sincronizar favorito; caché revertida');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  },
);

queryClient.setMutationDefaults<
  void,
  Error,
  { id: string },
  FavoriteContext
>(queryKeys.favorites.mutations.delete, {
  mutationFn: ({ id }) => deleteFavorite(id),
  onMutate: async ({ id }) => {
    await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
    const previous = queryClient.getQueryData<Favorite[]>(FAVORITES_KEY);
    queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) =>
      current.filter((favorite) => favorite.id !== id),
    );
    logSyncEvent('Eliminación de favorito guardada en caché', {
      id,
      status: 'pending',
    });
    return { previous };
  },
  onSuccess: (_data, { id }) => {
    logSyncEvent('Eliminación de favorito sincronizada con MockAPI', { id });
  },
  onError: (_error, _input, context) => {
    if (context?.previous) {
      queryClient.setQueryData(FAVORITES_KEY, context.previous);
    } else {
      queryClient.removeQueries({ queryKey: FAVORITES_KEY, exact: true });
    }
    logSyncEvent('Error al eliminar favorito; caché revertida');
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
});

queryClient.setMutationDefaults<Note, Error, NoteInput, NoteContext>(
  queryKeys.notes.mutations.create,
  {
    mutationFn: createNote,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: NOTES_KEY });
      const previous = queryClient.getQueryData<Note[]>(NOTES_KEY);
      queryClient.setQueryData<Note[]>(NOTES_KEY, (current = []) => [
        ...current,
        { ...input, id: `pending-${Date.now()}`, pending: true },
      ]);
      logSyncEvent('Nota guardada en caché', {
        pockeName: input.pockeName,
        status: 'pending',
      });
      return { previous };
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<Note[]>(NOTES_KEY, (current = []) => [
        ...current.filter(
          (note) => note.pokemonId !== saved.pokemonId || !note.pending,
        ),
        saved,
      ]);
      logSyncEvent('Nota sincronizada con MockAPI', {
        id: saved.id,
        pockeName: saved.pockeName,
        updatedAt: saved.updatedAt,
      });
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTES_KEY, context.previous);
      } else {
        queryClient.removeQueries({ queryKey: NOTES_KEY, exact: true });
      }
      logSyncEvent('Error al sincronizar nota; caché revertida');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
  },
);

queryClient.setMutationDefaults<Note, Error, UpdateNoteInput, NoteContext>(
  queryKeys.notes.mutations.update,
  {
    mutationFn: updateNote,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: NOTES_KEY });
      const previous = queryClient.getQueryData<Note[]>(NOTES_KEY);
      queryClient.setQueryData<Note[]>(NOTES_KEY, (current = []) =>
        current.map((note) =>
          note.id === input.id
            ? {
                ...note,
                content: input.content,
                updatedAt: input.updatedAt,
                pending: true,
              }
            : note,
        ),
      );
      logSyncEvent('Edición de nota guardada en caché', {
        id: input.id,
        updatedAt: input.updatedAt,
        status: 'pending',
      });
      return { previous };
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<Note[]>(NOTES_KEY, (current = []) =>
        current.map((note) => (note.id === saved.id ? saved : note)),
      );
      logSyncEvent('Edición de nota sincronizada con MockAPI', {
        id: saved.id,
        pockeName: saved.pockeName,
        updatedAt: saved.updatedAt,
      });
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTES_KEY, context.previous);
      } else {
        queryClient.removeQueries({ queryKey: NOTES_KEY, exact: true });
      }
      logSyncEvent('Error al editar nota; caché revertida', { id: _input.id });
    },
    onSettled: (_data, _error, input) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.notes.detail(input.id),
        }),
      ]),
  },
);

queryClient.setMutationDefaults<void, Error, { id: string }, NoteContext>(
  queryKeys.notes.mutations.delete,
  {
    mutationFn: ({ id }) => deleteNote(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_KEY });
      const previous = queryClient.getQueryData<Note[]>(NOTES_KEY);
      queryClient.setQueryData<Note[]>(NOTES_KEY, (current = []) =>
        current.filter((note) => note.id !== id),
      );
      logSyncEvent('Eliminación de nota guardada en caché', {
        id,
        status: 'pending',
      });
      return { previous };
    },
    onSuccess: (_data, { id }) => {
      logSyncEvent('Eliminación de nota sincronizada con MockAPI', { id });
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTES_KEY, context.previous);
      } else {
        queryClient.removeQueries({ queryKey: NOTES_KEY, exact: true });
      }
      logSyncEvent('Error al eliminar nota; caché revertida', { id: _input.id });
    },
    onSettled: (_data, _error, input) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTES_KEY }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.notes.detail(input.id),
        }),
      ]),
  },
);

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'appapiia-tanstack-query-cache',
});
