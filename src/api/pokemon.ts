import type { Pokemon } from './types';

type PokemonListResponse = {
  results: { name: string; url: string }[];
};

const POKE_API = 'https://pokeapi.co/api/v2';

export async function fetchPokemonList(offset = 0): Promise<Pokemon[]> {
  const response = await fetch(`${POKE_API}/pokemon?limit=30&offset=${offset}`);
  if (!response.ok) {
    throw new Error(`PokeAPI respondió con el estado ${response.status}.`);
  }

  const data = (await response.json()) as PokemonListResponse;
  return data.results.map(({ name, url }) => {
    const id = Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1]);
    if (!Number.isInteger(id) || id < 1) {
      throw new Error(`PokeAPI devolvió un identificador inválido para ${name}.`);
    }

    return {
      id,
      name,
      spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    };
  });
}

export async function fetchPokemon(id: number | string): Promise<Pokemon> {
  const response = await fetch(`${POKE_API}/pokemon/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el Pokémon (${response.status}).`);
  }

  const data = (await response.json()) as { id: number; name: string };
  return {
    id: data.id,
    name: data.name,
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
  };
}
