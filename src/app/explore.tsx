import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchFavorites, fetchNotes } from '@/api/mockApi';
import { queryKeys } from '@/api/queryKeys';
import { useDeleteFavorite, useDeleteNote, useUpdateNote } from '@/api/useMutations';
import type { Note } from '@/api/types';
import { ConnectionStatus } from '@/components/connection-status';

const palette = {
  ink: '#243a33',
  paper: '#faf6ec',
  muted: '#796f64',
  accent: '#c95b43',
  line: '#e8e0d2',
};

function getErrorMessage(error: Error) {
  return error.message || 'Ocurrió un error inesperado. Intenta de nuevo.';
}

function NoteRow({
  note,
  busy,
  onSave,
  onDelete,
}: {
  note: Note;
  busy: boolean;
  onSave: (content: string) => void;
  onDelete: () => void;
}) {
  const [content, setContent] = useState(note.content);

  return (
    <View style={styles.noteCard}>
      <View style={styles.noteTop}>
        {note.spriteUrl && (
          <Image
            source={{ uri: note.spriteUrl }}
            style={styles.sprite}
            contentFit="contain"
          />
        )}
        <View style={styles.noteHeading}>
          <Text style={styles.pokemonName}>{note.pockeName}</Text>
          {note.pending && <Text style={styles.pending}>Pendiente de sincronizar</Text>}
        </View>
      </View>
      <TextInput
        accessibilityLabel={`Editar nota de ${note.pockeName}`}
        editable={!note.pending}
        multiline
        onChangeText={setContent}
        placeholder="Escribe una nota"
        placeholderTextColor={palette.muted}
        style={styles.noteInput}
        value={content}
      />
      <View style={styles.noteActions}>
        <Pressable
          disabled={busy || note.pending || content.trim() === note.content}
          onPress={() => onSave(content.trim())}
          style={[
            styles.button,
            styles.primaryButton,
            (busy || note.pending || content.trim() === note.content) && styles.disabled,
          ]}>
          {busy ? (
            <ActivityIndicator color={palette.paper} size="small" />
          ) : (
            <Text style={styles.primaryLabel}>Guardar cambios</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy || note.pending}
          onPress={onDelete}
          style={[styles.button, styles.deleteButton, (busy || note.pending) && styles.disabled]}>
          <Text style={styles.deleteLabel}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CollectionScreen() {
  const favoritesQuery = useQuery({
    queryKey: queryKeys.favorites.list(),
    queryFn: fetchFavorites,
  });
  const notesQuery = useQuery({
    queryKey: queryKeys.notes.list(),
    queryFn: fetchNotes,
  });
  const deleteFavorite = useDeleteFavorite();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const favorites = favoritesQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const error =
    favoritesQuery.error ??
    notesQuery.error ??
    deleteFavorite.error ??
    updateNote.error ??
    deleteNote.error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={notes}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          notesQuery.isPending ? (
            <View style={styles.center}>
              <ActivityIndicator color={palette.accent} size="large" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyMark}>✳</Text>
              <Text style={styles.emptyTitle}>Aún no hay notas</Text>
              <Text style={styles.emptyText}>
                Guarda una observación desde la Pokédex y aparecerá aquí.
              </Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>TU CUADERNO</Text>
            <Text style={styles.title}>Colección{'\n'}personal.</Text>
            <Text style={styles.intro}>
              Favoritos y apuntes, listos para consultar incluso sin conexión.
            </Text>
            <ConnectionStatus />
            {error && (
              <View style={styles.errorNotice}>
                <Text style={styles.errorTitle}>No pudimos sincronizar</Text>
                <Text style={styles.errorMessage}>{getErrorMessage(error)}</Text>
                <Pressable
                  onPress={() => {
                    void favoritesQuery.refetch();
                    void notesQuery.refetch();
                  }}
                  style={styles.retry}>
                  <Text style={styles.retryLabel}>Intentar otra vez</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{favorites.length}</Text>
                <Text style={styles.statLabel}>FAVORITOS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{notes.length}</Text>
                <Text style={styles.statLabel}>APUNTES</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Tus favoritos</Text>
            {favorites.length === 0 && (
              <Text style={styles.hint}>Los Pokémon que marques aparecerán aquí.</Text>
            )}
            <View style={styles.favoriteList}>
              {favorites.map((favorite) => (
                <View key={favorite.id} style={styles.favoriteRow}>
                  <Image
                    source={{ uri: favorite.spriteUrl }}
                    style={styles.favoriteSprite}
                    contentFit="contain"
                  />
                  <View style={styles.favoriteInfo}>
                    <Text style={styles.pokemonName}>{favorite.pokemonName}</Text>
                    {favorite.pending && (
                      <Text style={styles.pending}>Pendiente de sincronizar</Text>
                    )}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${favorite.pokemonName} de favoritos`}
                    disabled={deleteFavorite.isPending || favorite.pending}
                    onPress={() => deleteFavorite.mutate({ id: favorite.id })}
                    style={styles.removeButton}>
                    <Text style={styles.removeLabel}>Quitar</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Notas de campo</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void favoritesQuery.refetch();
              void notesQuery.refetch();
            }}
            refreshing={favoritesQuery.isRefetching || notesQuery.isRefetching}
            tintColor={palette.accent}
          />
        }
        renderItem={({ item }) => (
          <NoteRow
            key={`${item.id}:${item.content}:${item.pending ? 'pending' : 'saved'}`}
            busy={updateNote.isPending || deleteNote.isPending}
            note={item}
            onDelete={() => deleteNote.mutate({ id: item.id })}
            onSave={(content) =>
              updateNote.mutate({
                id: item.id,
                content,
                updatedAt: new Date().toISOString(),
              })
            }
          />
        )}
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
    paddingBottom: 42,
    paddingHorizontal: 20,
    paddingTop: 16,
    width: '100%',
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
  intro: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
    marginTop: 12,
    maxWidth: 330,
  },
  errorNotice: {
    backgroundColor: '#f5d9d4',
    borderRadius: 16,
    marginBottom: 16,
    padding: 14,
  },
  errorTitle: {
    color: '#763d30',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  errorMessage: {
    color: '#763d30',
    fontSize: 12,
    lineHeight: 18,
  },
  retry: {
    alignSelf: 'flex-start',
    backgroundColor: '#763d30',
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  retryLabel: {
    color: palette.paper,
    fontSize: 12,
    fontWeight: '800',
  },
  stats: {
    alignItems: 'center',
    backgroundColor: '#efe8d9',
    borderRadius: 20,
    flexDirection: 'row',
    marginBottom: 25,
    paddingHorizontal: 24,
    paddingVertical: 17,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 25,
    fontWeight: '700',
  },
  statLabel: {
    color: palette.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 3,
  },
  statDivider: {
    backgroundColor: '#d8cebd',
    height: 34,
    width: 1,
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 11,
  },
  hint: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: 11,
  },
  favoriteList: {
    marginBottom: 23,
  },
  favoriteRow: {
    alignItems: 'center',
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
  },
  favoriteSprite: {
    height: 46,
    marginRight: 10,
    width: 46,
  },
  favoriteInfo: {
    flex: 1,
  },
  pokemonName: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  pending: {
    color: palette.accent,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  removeButton: {
    backgroundColor: '#efe8d9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeLabel: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  noteCard: {
    backgroundColor: '#fffdf8',
    borderColor: palette.line,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
  },
  noteTop: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  sprite: {
    height: 48,
    marginRight: 9,
    width: 48,
  },
  noteHeading: {
    flex: 1,
  },
  noteInput: {
    backgroundColor: palette.paper,
    borderRadius: 13,
    color: palette.ink,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 70,
    padding: 12,
    textAlignVertical: 'top',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 13,
  },
  primaryButton: {
    backgroundColor: palette.ink,
    flex: 1,
  },
  primaryLabel: {
    color: palette.paper,
    fontSize: 11,
    fontWeight: '800',
  },
  deleteButton: {
    backgroundColor: '#f5e1dc',
  },
  deleteLabel: {
    color: '#763d30',
    fontSize: 11,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
  center: {
    paddingVertical: 34,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 25,
  },
  emptyMark: {
    color: palette.accent,
    fontSize: 32,
    marginBottom: 5,
  },
  emptyTitle: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 5,
  },
  emptyText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
