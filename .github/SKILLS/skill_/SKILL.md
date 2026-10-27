---
name: tanstack-query
description: Genera una aplicación completa de React Native con Expo y TanStack Query cumpliendo los requisitos del DEBER 4 (persistencia, caché offline, mutaciones optimistas, query keys, y documentación README).
---
# Generador del Deber 4: TanStack Query + Offline + Persistencia

Esta skill automatiza la creación y configuración completa del DEBER 4, garantizando que no se pierdan puntos por falta de requerimientos técnicos o de documentación.

## Cuándo usar
- Cuando el usuario solicite generar el código para su tarea de React Native con TanStack Query, consumiendo una API pública (ej. PokeAPI) y una MockAPI.
- Cuando necesite la estructura de carpetas, el código de los providers, las mutaciones offline y el `README.md` con las justificaciones requeridas.

## Pasos de Ejecución

1. **Definición de Diseño (Anti-Penalización):**
   - Asegúrate de generar estilos propios (colores, bordes redondeados, tipografías) para los componentes. NO uses diseños "genéricos de IA" (esto evita la penalización de -5 puntos).

2. **Jerarquía de Claves (`src/api/queryKeys.ts`):**
   - Define un objeto con jerarquía estricta (nivel `all`, `list`, `detail`) para la API pública (ej. pokemon) y para MockAPI (ej. favorites, notes).

3. **Configuración de Persistencia y Conexión (`src/api/queryClient.ts`):**
   - Implementa `NetInfo` de `@react-native-community/netinfo` y conéctalo al `onlineManager`.
   - Configura el `QueryClient`. Establece el `gcTime` global (ej. 24 horas) y `staleTime` diferenciado (API pública alto, MockAPI bajo).
   - Crea el persister usando `createAsyncStoragePersister` y `AsyncStorage`. El `maxAge` debe ser igual o menor que el `gcTime`.
   - Configura `queryClient.setMutationDefaults` para las mutaciones de creación/edición, incluyendo la lógica de **Actualización Optimista** en el `onMutate` (agregando un flag `pending: true`), rollback en `onError` y limpieza en `onSettled`.

4. **Proveedor de la Aplicación (`App.tsx`):**
   - Envuelve la aplicación en `<PersistQueryClientProvider>`.
   - En la prop `persistOptions`, configura el `persister` y define la función `onSuccess: () => queryClient.resumePausedMutations()`.

5. **Hooks y UI:**
   - Genera un ejemplo de uso de `useQuery` para la lectura.
   - Genera el componente visual que evalúe si el item tiene el flag `pending: true` para mostrar un indicador visual de "Pendiente" cuando se interactúa sin red.
   - Asegúrate de implementar al menos un `useMutation` con su respectivo `mutationKey` y su `invalidateQueries` correspondiente al hacer POST, PUT o DELETE.

6. **Generación del README (`README.md`):**
   - Redacta las justificaciones exigidas: 
     - Qué clave se invalida después de cada mutación y por qué.
     - Justificación de los valores de `staleTime` y `gcTime` para API pública vs MockAPI.
     - Explicación de qué pasaría si `gcTime` fuera menor que el `maxAge` del persister.
   - Incluye el guion o checklist sugerido para el video demostrativo (de 4 a 6 min).

## Gotchas y Verificaciones de Seguridad
- Nunca olvidar el `resumePausedMutations()` en el provider, es vital para que las mutaciones se envíen al recuperar la red.
- La actualización optimista DEBE mostrar el indicador de "Pendiente" en la UI.
- `gcTime` DEBE ser `>=` `maxAge`. Si `gcTime` es menor, React Query limpia la memoria RAM antes de que el persister limpie el almacenamiento físico, generando inconsistencias al abrir la app.