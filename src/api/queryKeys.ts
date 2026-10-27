export const queryKeys = {
  pokemon: {
    all: ['pokemon'] as const,
    lists: () => [...queryKeys.pokemon.all, 'list'] as const,
    list: (offset = 0) => [...queryKeys.pokemon.lists(), offset] as const,
    details: () => [...queryKeys.pokemon.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.pokemon.details(), id] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    lists: () => [...queryKeys.favorites.all, 'list'] as const,
    list: () => [...queryKeys.favorites.lists()] as const,
    details: () => [...queryKeys.favorites.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.favorites.details(), id] as const,
    mutations: {
      create: ['favorites', 'create'] as const,
      delete: ['favorites', 'delete'] as const,
    },
  },
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: () => [...queryKeys.notes.lists()] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
    mutations: {
      create: ['notes', 'create'] as const,
      update: ['notes', 'update'] as const,
      delete: ['notes', 'delete'] as const,
    },
  },
} as const;
