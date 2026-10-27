import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchFavorites, fetchNotes } from '@/api/mockApi';
import { fetchPokemon, fetchPokemonList } from '@/api/pokemon';
import { queryKeys } from '@/api/queryKeys';
import {
  useCreateFavorite,
  useCreateNote,
  useDeleteFavorite,
  useUpdateNote,
} from '@/api/useMutations';
import type { Pokemon } from '@/api/types';
import { ConnectionStatus } from '@/components/connection-status';
import { PokemonCard } from '@/components/pokemon-card';

const palette = {
  ink: '#243a33',
  paper: '#faf6ec',
  muted: '#796f64',
  accent: '#c95b43',
  line: '#e8e0d2',
};

function getErrorMessage(error: Error | null) {
  return error?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export default function PokedexScreen() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.pokemon.list(0),
    queryFn: ({ pageParam }) => fetchPokemonList(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 30 ? pages.length * 30 : undefined,
  });
  const pokemonLookup = useQuery({
    queryKey: queryKeys.pokemon.detail(submittedSearch),
    queryFn: () => fetchPokemon(submittedSearch),
    enabled: submittedSearch.length > 0,
    retry: false,
  });
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.list(),
    queryFn: fetchFavorites,
  });
  const notesQuery = useQuery({
    queryKey: queryKeys.notes.list(),
    queryFn: fetchNotes,
  });

  const createFavorite = useCreateFavorite();
  const deleteFavorite = useDeleteFavorite();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const favorites = favoritesQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const catalog = useMemo(
    () => listQuery.data?.pages.flat() ?? [],
    [listQuery.data],
  );
  const visiblePokemon = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (submittedSearch) {
      return pokemonLookup.data ? [pokemonLookup.data] : [];
    }
    return catalog.filter((pokemon) =>
      `${pokemon.name} ${pokemon.id}`.toLowerCase().includes(normalized),
    );
  }, [catalog, pokemonLookup.data, search, submittedSearch]);

  const mutationError =
    createFavorite.error ??
    deleteFavorite.error ??
    createNote.error ??
    updateNote.error;
  const mockApiError = favoritesQuery.error ?? notesQuery.error;

  function toggleFavorite(pokemon: Pokemon) {
    const favorite = favorites.find((item) => item.pokemonId === pokemon.id);
    if (favorite) {
      deleteFavorite.mutate({ id: favorite.id });
      return;
    }

    createFavorite.mutate({
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      spriteUrl: pokemon.spriteUrl,
      createdAt: new Date().toISOString(),
    });
  }

  function savePokemonNote(pokemon: Pokemon, content: string) {
    const existing = notes.find((item) => item.pokemonId === pokemon.id);
    if (existing) {
      updateNote.mutate({
        id: existing.id,
        content,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    createNote.mutate({
      pokemonId: pokemon.id,
      pockeName: pokemon.name,
      spriteUrl: pokemon.spriteUrl,
      content,
      updatedAt: new Date().toISOString(),
    });
  }

  const renderFooter = () => {
    if (submittedSearch || !listQuery.hasNextPage) return null;

    return (
      <Pressable
        disabled={listQuery.isFetchingNextPage}
        onPress={() => listQuery.fetchNextPage()}
        style={styles.loadMore}>
        {listQuery.isFetchingNextPage ? (
          <ActivityIndicator color={palette.paper} size="small" />
        ) : (
          <Text style={styles.loadMoreLabel}>Cargar más especies</Text>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={visiblePokemon}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          listQuery.isPending || (submittedSearch !== '' && pokemonLookup.isPending) ? (
            <View style={styles.center}>
              <ActivityIndicator color={palette.accent} size="large" />
              <Text style={styles.loading}>
                {submittedSearch ? 'Buscando especie...' : 'Explorando la Pokédex...'}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {pokemonLookup.isError
                  ? 'No encontramos esa especie'
                  : listQuery.isError
                    ? 'No pudimos conectar'
                    : 'No encontramos Pokémon'}
              </Text>
              <Text style={styles.body}>
                {pokemonLookup.isError
                  ? 'Revisa el nombre o número e inténtalo de nuevo.'
                  : listQuery.isError
                  ? getErrorMessage(listQuery.error)
                  : 'Prueba con otro nombre o número.'}
              </Text>
              {listQuery.isError && (
                <Pressable onPress={() => listQuery.refetch()} style={styles.retry}>
                  <Text style={styles.retryLabel}>Intentar otra vez</Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListHeaderComponent={
          <View>
            <View style={styles.brandRow}>
              <View>
                <Text style={styles.eyebrow}>BITÁCORA DE CAMPO · KANTO</Text>
                <Text style={styles.title}>Pequeñas{'\n'}grandes criaturas.</Text>
              </View>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>P.</Text>
              </View>
            </View>
            <Text style={styles.intro}>
              Explora especies, guarda tus favoritas y apunta lo que quieras recordar.
            </Text>
            <ConnectionStatus />
            {mockApiError && (
              <View style={styles.configNotice}>
                <Text style={styles.configTitle}>Conecta tu MockAPI</Text>
                <Text style={styles.configText}>{getErrorMessage(mockApiError)}</Text>
              </View>
            )}
            {mutationError && (
              <View style={styles.errorNotice}>
                <Text style={styles.errorText}>{getErrorMessage(mutationError)}</Text>
              </View>
            )}
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Encuentros</Text>
                <Text style={styles.sectionSubtitle}>
                  {catalog.length} especies cargadas
                </Text>
              </View>
              <Text style={styles.pageNumber}>
                DEX · {String(Math.max(catalog.length, 1)).padStart(3, '0')}
              </Text>
            </View>
            <TextInput
              accessibilityLabel="Buscar Pokémon"
              onChangeText={(value) => {
                setSearch(value);
                setSubmittedSearch('');
              }}
              onSubmitEditing={() => setSubmittedSearch(search.trim().toLowerCase())}
              placeholder="Buscar por nombre o número"
              placeholderTextColor={palette.muted}
              returnKeyType="search"
              style={styles.search}
              value={search}
            />
          </View>
        }
        ListFooterComponent={ renderFooter
        }
        renderItem={({ item }) => {
          const favorite = favorites.find((entry) => entry.pokemonId === item.id);
          const note = notes.find((entry) => entry.pokemonId === item.id);
          return (
            <PokemonCard
              favorite={favorite}
              favoriteBusy={createFavorite.isPending || deleteFavorite.isPending}
              note={note}
              noteBusy={createNote.isPending || updateNote.isPending}
              onFavorite={() => toggleFavorite(item)}
              onSaveNote={(content) => savePokemonNote(item, content)}
              pokemon={item}
            />
          );
        }}
        onEndReached={() => {
          if (!submittedSearch && listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
            void listQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.45}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.paper,
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 680,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 16,
    width: '100%',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 9,
  },
  title: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 39,
  },
  brandMark: {
    alignItems: 'center',
    borderColor: palette.ink,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    transform: [{ rotate: '-9deg' }],
    width: 56,
  },
  brandMarkText: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
  },
  intro: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
    maxWidth: 320,
  },
  configNotice: {
    backgroundColor: '#f5e8c9',
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
  },
  configTitle: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  configText: {
    color: '#62574e',
    fontSize: 12,
    lineHeight: 18,
  },
  errorNotice: {
    backgroundColor: '#f5d9d4',
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
  },
  errorText: {
    color: '#763d30',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 10,
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 25,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  pageNumber: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  search: {
    backgroundColor: '#fffdf8',
    borderColor: palette.line,
    borderRadius: 15,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 14,
    marginBottom: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loading: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 12,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 38,
  },
  emptyTitle: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retry: {
    backgroundColor: palette.ink,
    borderRadius: 14,
    marginTop: 15,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  retryLabel: {
    color: palette.paper,
    fontSize: 12,
    fontWeight: '800',
  },
  loadMore: {
    alignItems: 'center',
    backgroundColor: palette.ink,
    borderRadius: 16,
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 46,
  },
  loadMoreLabel: {
    color: palette.paper,
    fontSize: 12,
    fontWeight: '800',
  },
});
