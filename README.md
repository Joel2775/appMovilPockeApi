# Bitácora Pokémon

Aplicación móvil construida con Expo, React Native y TanStack Query. Consulta Pokémon desde PokeAPI y permite guardar Favoritos y Notas en MockAPI. La caché se persiste localmente y las mutaciones se ponen en cola cuando el dispositivo queda sin conexión.

## Configuración

1. Instala las dependencias con `npm install`.
2. En el proyecto MockAPI agrega el recurso `favorites` y amplía `notes` con los campos que se indican abajo.
3. La URL base está en `.env.example`; copia ese archivo a `.env` si necesitas restaurar la configuración local.
4. Reinicia Expo para cargar la variable: `npx expo start`.

El endpoint base se configura en `EXPO_PUBLIC_MOCKAPI_BASE_URL`. La app construye las rutas `/favorites` y `/notes`. No pongas secretos en variables `EXPO_PUBLIC_`: su valor se incluye en el bundle de la aplicación.

### Datos guardados

La URL base configurada es `https://6adffbfa8e42963c8d5ea09c.mockapi.io`; la app consulta `/favorites` y `/notes`. El endpoint `/notes` ya existe y responde correctamente. El endpoint `/favorites` todavía no existe y debes crearlo en MockAPI antes de usar Favoritos.

Conserva el campo existente `pockeName` en `notes` y agrega `pokemonId`, `spriteUrl` y `updatedAt`, para que la app pueda relacionar cada nota con su Pokémon. La app crea notas con esta forma:

```json
{
  "pokemonId": 25,
  "pockeName": "pikachu",
  "spriteUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  "content": "Mi primera nota",
  "updatedAt": "2026-10-26T20:00:00.000Z"
}
```

Para el recurso `favorites`, configura los campos `pokemonId`, `pokemonName`, `spriteUrl` y `createdAt`. MockAPI asigna el `id` persistente al crear cada registro. Las notas existentes se editan con `PATCH`; los favoritos y notas se eliminan por su `id`.

## Caché, persistencia y sincronización

### Claves de consulta e invalidación

Las claves están centralizadas en [`src/api/queryKeys.ts`](./src/api/queryKeys.ts) y mantienen jerarquías para `pokemon`, `favorites` y `notes`, con niveles `all`, `list` y `detail`.

- **Crear favorito (`POST`)**: la mutación agrega optimistamente un elemento con `pending: true`, y al recibir la respuesta sustituye el ID temporal por el ID real de MockAPI. Después invalida `queryKeys.favorites.list()` para confirmar la colección desde el servidor.
- **Eliminar favorito (`DELETE`)**: retira optimistamente el registro, restaura la caché si falla y luego invalida la lista de Favoritos.
- **Crear nota (`POST`)**: añade una nota optimista marcada como pendiente, la reemplaza por la respuesta persistida y luego invalida `queryKeys.notes.list()`.
- **Editar nota (`PATCH`)**: actualiza el texto optimistamente, restaura el valor previo si falla e invalida tanto `queryKeys.notes.detail(id)` como la lista de Notas para sincronizar la vista individual y la colección.
- **Eliminar nota (`DELETE`)**: elimina optimistamente, revierte en caso de error e invalida la lista y el detalle de la nota afectada.

La invalidación fuerza una lectura de los datos confirmados por MockAPI. En una creación esto es especialmente importante: permite que la interfaz use el ID real de la base de datos en vez de conservar el ID temporal de la actualización optimista.

### Tiempos de caché

- **PokeAPI** usa un `staleTime` de 12 horas: los datos de especies cambian poco, por lo que la caché local evita solicitudes repetidas y facilita la navegación offline.
- **MockAPI** usa un `staleTime` de 1 minuto: Favoritos y Notas pueden cambiar con frecuencia y deben volver a validarse con mayor regularidad.
- El `gcTime` global es de 24 horas, igual al `maxAge` del persister. Así, la caché que sigue vigente en AsyncStorage también puede ser hidratada por TanStack Query.

Si `gcTime` fuera menor que `maxAge`, TanStack Query podría retirar de memoria consultas antes de que expire la copia persistida. Al restaurar una sesión, los datos pueden haber expirado según la política de caché aunque todavía permanezcan guardados; esto genera lecturas y revalidaciones inconsistentes y puede eliminar la ventaja de tener una copia local válida.

### Mutaciones offline

NetInfo actualiza el `onlineManager` de TanStack Query. Las mutaciones usan `networkMode: 'online'`, por lo que quedan pausadas sin conexión. AsyncStorage persiste la caché y las mutaciones pausadas; al hidratar el proveedor se ejecuta `resumePausedMutations()` para enviarlas cuando vuelva la conectividad.

La UI marca como **Pendiente de sincronizar** los Favoritos o las Notas creados o editados optimistamente. Si MockAPI devuelve un error, se muestra el error y se revierte la caché al estado anterior.

Para observar el flujo en la consola de Expo/Metro, busca los mensajes con prefijo `[offline-sync]`. Cada evento incluye fecha y hora local (`dateTime`) y marca UTC (`timestamp`): se registra cuando el cambio optimista se escribe en la caché, al restaurarse la conexión y cuando MockAPI confirma la sincronización. Si la operación falla, también se registra el rollback.

