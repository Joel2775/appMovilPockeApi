export type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
};

export type Favorite = {
  id: string;
  pokemonId: number;
  pokemonName: string;
  spriteUrl: string;
  createdAt: string;
  pending?: boolean;
};

export type FavoriteInput = Omit<Favorite, 'id' | 'pending'>;

export type Note = {
  id: string;
  pokemonId?: number;
  pockeName: string;
  spriteUrl?: string;
  content: string;
  updatedAt?: string;
  pending?: boolean;
};

export type NoteInput = {
  pokemonId: number;
  pockeName: string;
  spriteUrl: string;
  content: string;
  updatedAt: string;
};

export type UpdateNoteInput = {
  id: string;
  content: string;
  updatedAt: string;
};
