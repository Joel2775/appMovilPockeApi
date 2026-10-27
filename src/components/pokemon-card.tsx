import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Favorite, Note, Pokemon } from '@/api/types';

type Props = {
  pokemon: Pokemon;
  favorite?: Favorite;
  note?: Note;
  favoriteBusy: boolean;
  noteBusy: boolean;
  onFavorite: () => void;
  onSaveNote: (content: string) => void;
};

const colors = ['#d9e8d1', '#f4dfc9', '#dce4f1', '#f2dce5'];

export function PokemonCard({
  pokemon,
  favorite,
  note,
  favoriteBusy,
  noteBusy,
  onFavorite,
  onSaveNote,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note?.content ?? '');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors[pokemon.id % colors.length] },
      ]}>
      <View style={styles.topRow}>
        <Text style={styles.number}>Nº {String(pokemon.id).padStart(3, '0')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite ? `Quitar ${pokemon.name} de favoritos` : `Guardar ${pokemon.name} en favoritos`
          }
          disabled={favoriteBusy || favorite?.pending}
          onPress={onFavorite}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}>
          {favoriteBusy ? (
            <ActivityIndicator color="#fffaf0" size="small" />
          ) : (
            <Text style={styles.favoriteIcon}>{favorite ? '♥' : '♡'}</Text>
          )}
        </Pressable>
      </View>

      <Image source={{ uri: pokemon.spriteUrl }} style={styles.sprite} contentFit="contain" />
      <Text style={styles.name}>{pokemon.name}</Text>
      {note?.pending && <Text style={styles.pending}>Pendiente de sincronizar</Text>}

      {editing ? (
        <View style={styles.noteEditor}>
          <TextInput
            accessibilityLabel={`Nota para ${pokemon.name}`}
            multiline
            onChangeText={setDraft}
            placeholder="Escribe un dato o recuerdo..."
            placeholderTextColor="#887b6e"
            style={styles.input}
            value={draft}
          />
          <View style={styles.actions}>
            <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
            <Pressable
              disabled={!draft.trim() || noteBusy || note?.pending}
              onPress={() => {
                onSaveNote(draft.trim());
                setEditing(false);
              }}
              style={[styles.saveButton, (!draft.trim() || noteBusy) && styles.disabled]}>
              {noteBusy ? (
                <ActivityIndicator color="#fffaf0" size="small" />
              ) : (
                <Text style={styles.saveLabel}>Guardar nota</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Text numberOfLines={1} style={styles.notePreview}>
            {note ? note.content : 'Sin nota todavía'}
          </Text>
          <Pressable
            disabled={noteBusy || note?.pending}
            onPress={() => {
              setDraft(note?.content ?? '');
              setEditing(true);
            }}
            style={styles.noteButton}>
            <Text style={styles.noteButtonLabel}>{note ? 'Editar' : '+ Nota'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 14,
    minHeight: 240,
    overflow: 'hidden',
    padding: 18,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  number: {
    color: '#62574e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: '#283a32',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  favoriteIcon: {
    color: '#fffaf0',
    fontSize: 21,
    lineHeight: 24,
  },
  sprite: {
    alignSelf: 'center',
    height: 112,
    width: 128,
  },
  name: {
    color: '#283a32',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  pending: {
    color: '#9a4f36',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  notePreview: {
    color: '#554b42',
    flex: 1,
    fontSize: 12,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 12,
  },
  noteButton: {
    backgroundColor: '#fffaf0',
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  noteButtonLabel: {
    color: '#283a32',
    fontSize: 12,
    fontWeight: '800',
  },
  noteEditor: {
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fffaf0',
    borderRadius: 14,
    color: '#283a32',
    fontSize: 14,
    minHeight: 60,
    padding: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#283a32',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 112,
    paddingHorizontal: 14,
  },
  saveLabel: {
    color: '#fffaf0',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelButton: {
    padding: 8,
  },
  cancelLabel: {
    color: '#62574e',
    fontSize: 12,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
