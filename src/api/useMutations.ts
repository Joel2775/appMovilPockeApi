import { useMutation } from '@tanstack/react-query';

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

export function useCreateFavorite() {
  return useMutation<Favorite, Error, FavoriteInput>({
    mutationKey: queryKeys.favorites.mutations.create,
    mutationFn: createFavorite,
  });
}

export function useDeleteFavorite() {
  return useMutation<void, Error, { id: string }>({
    mutationKey: queryKeys.favorites.mutations.delete,
    mutationFn: ({ id }) => deleteFavorite(id),
  });
}

export function useCreateNote() {
  return useMutation<Note, Error, NoteInput>({
    mutationKey: queryKeys.notes.mutations.create,
    mutationFn: createNote,
  });
}

export function useUpdateNote() {
  return useMutation<Note, Error, UpdateNoteInput>({
    mutationKey: queryKeys.notes.mutations.update,
    mutationFn: updateNote,
  });
}

export function useDeleteNote() {
  return useMutation<void, Error, { id: string }>({
    mutationKey: queryKeys.notes.mutations.delete,
    mutationFn: ({ id }) => deleteNote(id),
  });
}

export type { FavoriteInput, NoteInput, UpdateNoteInput };
