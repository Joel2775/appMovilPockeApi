import type { Favorite, FavoriteInput, Note, NoteInput, UpdateNoteInput } from './types';

const configuredBaseUrl = process.env.EXPO_PUBLIC_MOCKAPI_BASE_URL?.trim();

function getResourceUrl(resource: 'favorites' | 'notes', id?: string) {
  if (!configuredBaseUrl) {
    throw new Error(
      'Falta configurar EXPO_PUBLIC_MOCKAPI_BASE_URL. Cópiala desde .env.example y agrega la URL de tu proyecto MockAPI.',
    );
  }

  const baseUrl = configuredBaseUrl.replace(/\/+$/, '');
  return `${baseUrl}/${resource}${id ? `/${encodeURIComponent(id)}` : ''}`;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `MockAPI respondió con el estado ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

async function requestDelete(url: string): Promise<void> {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `MockAPI respondió con el estado ${response.status}.`,
    );
  }
}

export function fetchFavorites(): Promise<Favorite[]> {
  return requestJson<Favorite[]>(getResourceUrl('favorites'));
}

export function createFavorite(input: FavoriteInput): Promise<Favorite> {
  return requestJson<Favorite>(getResourceUrl('favorites'), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteFavorite(id: string): Promise<void> {
  return requestDelete(getResourceUrl('favorites', id));
}

export function fetchNotes(): Promise<Note[]> {
  return requestJson<Note[]>(getResourceUrl('notes'));
}

export function createNote(input: NoteInput): Promise<Note> {
  return requestJson<Note>(getResourceUrl('notes'), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateNote(input: UpdateNoteInput): Promise<Note> {
  return requestJson<Note>(getResourceUrl('notes', input.id), {
    method: 'PATCH',
    body: JSON.stringify({
      content: input.content,
      updatedAt: input.updatedAt,
    }),
  });
}

export function deleteNote(id: string): Promise<void> {
  return requestDelete(getResourceUrl('notes', id));
}
