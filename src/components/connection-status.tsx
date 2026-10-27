import { useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const queuedMutations = useIsMutating();

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setIsOnline(
          state.isConnected === true && state.isInternetReachable !== false,
        );
      }),
    [],
  );

  if (isOnline && queuedMutations === 0) {
    return null;
  }

  const label = isOnline
    ? `${queuedMutations} cambio${queuedMutations === 1 ? '' : 's'} en cola`
    : 'Sin conexión · los cambios se sincronizarán al volver';

  return (
    <View style={[styles.banner, isOnline ? styles.queued : styles.offline]}>
      <View style={styles.dot} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  queued: {
    backgroundColor: '#f5e8c9',
  },
  offline: {
    backgroundColor: '#f5d9d4',
  },
  dot: {
    backgroundColor: '#ba4c37',
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  label: {
    color: '#50372f',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
});
