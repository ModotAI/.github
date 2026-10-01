# Prompt per Claude Code — Collegare l'app Expo al backend

Copia e incolla questo prompt in Claude Code nella cartella del progetto Expo (`anonymous-chat/`).

**PRIMA di incollare**: sostituisci `TUO_SERVER_IP` con l'IP o dominio reale del tuo server (es. `192.168.1.100` o `mioserver.com`).

---

## PROMPT

Devo collegare questa app Expo di messaggistica anonima a un backend reale (Node.js + Express + Socket.IO + PostgreSQL) che gira su `http://TUO_SERVER_IP:3000`.

L'app attualmente usa Zustand con persistenza locale — tutto è offline. Devo riscrivere il data layer per usare API REST + Socket.IO real-time, mantenendo Zustand come cache locale.

### Architettura target

```
App Expo  <-->  API REST (fetch)     <-->  Backend Express  <-->  PostgreSQL
          <-->  Socket.IO (real-time) <-->
```

- **Zustand** resta come cache locale e per i settings (che restano solo locali: wallpaper, fontSize, ecc.)
- **API REST** per: registrazione, ricerca utenti, CRUD contatti/chat/messaggi
- **Socket.IO** per: messaggi real-time, typing indicators, online status, conferme di lettura

### File da modificare/creare

#### 1. `src/services/api.ts` (NUOVO)

Client API REST. Tutte le chiamate HTTP al backend.

```typescript
const API_URL = "http://TUO_SERVER_IP:3000/api";

// Ogni richiesta manda l'header x-user-id con l'ID dell'utente corrente
// Funzioni:
// - registerUser(id, username, displayName): POST /api/auth/register
// - searchUsers(query): GET /api/users/search?q=query
// - getUser(id): GET /api/users/:id
// - updateUser(id, updates): PATCH /api/users/:id
// - getContacts(): GET /api/contacts
// - addContact(contactId): POST /api/contacts
// - removeContact(contactId): DELETE /api/contacts/:contactId
// - toggleBlock(contactId): PATCH /api/contacts/:contactId/block
// - toggleFavorite(contactId): PATCH /api/contacts/:contactId/favorite
// - getChats(): GET /api/chats
// - createPrivateChat(otherUserId): POST /api/chats/private
// - createGroupChat(name, participantIds): POST /api/chats/group
// - updateChatSettings(chatId, updates): PATCH /api/chats/:chatId
// - deleteChat(chatId): DELETE /api/chats/:chatId
// - getMessages(chatId, before?, limit?): GET /api/chats/:chatId/messages
// - sendMessage(chatId, message): POST /api/chats/:chatId/messages
// - editMessage(messageId, text): PATCH /api/messages/:messageId
// - deleteMessage(messageId, forEveryone): DELETE /api/messages/:messageId
// - reactToMessage(messageId, emoji): POST /api/messages/:messageId/react
// - markAsRead(chatId): POST /api/chats/:chatId/read
// - getCalls(): GET /api/calls
```

Ogni funzione usa `fetch()` con JSON. Gestisci errori con try/catch e ritorna `null` in caso di errore.

**Importante**: il `userId` per l'header `x-user-id` va preso dallo store Zustand (l'utente corrente già esiste persistito localmente).

#### 2. `src/services/socket.ts` (NUOVO)

Client Socket.IO per real-time.

```typescript
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://TUO_SERVER_IP:3000";

let socket: Socket | null = null;

export function connectSocket(userId: string) {
  if (socket?.connected) return;
  socket = io(SOCKET_URL, {
    auth: { userId },
    transports: ["websocket"],
  });

  socket.on("connect", () => console.log("Socket connected"));
  socket.on("disconnect", () => console.log("Socket disconnected"));

  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// Helper per emettere eventi
export function emitTyping(chatId: string, isTyping: boolean) {
  socket?.emit(isTyping ? "typing:start" : "typing:stop", { chatId });
}
```

#### 3. `src/store/index.ts` (RISCRIVERE)

Il store Zustand va riscritto per:

**Cose che RESTANO locali (Zustand persist)**:
- `settings` (AppSettings) — wallpaper, fontSize, ecc. sono preferenze locali
- `currentUser` — l'utente corrente (viene registrato al backend all'init)
- `_hydrated` — flag di hydration

**Cose che vengono dal SERVER**:
- `users` — cache locale, popolata dalle risposte API
- `chats` — caricati dal server, aggiornati via socket
- `messages` — caricati dal server per chat, aggiornati via socket
- `contacts` — caricati dal server
- `calls` — caricati dal server

**Flow di inizializzazione** (`initialize`):
1. Se `currentUser` esiste già (persistito), chiama `registerUser()` per registrarlo/sincronizzarlo col backend
2. Se non esiste, genera un nuovo utente (come ora), poi `registerUser()`
3. Connetti il socket con `connectSocket(userId)`
4. Carica contatti, chat dal server e mettili nello store
5. Registra i listener Socket.IO per aggiornamenti real-time

**Flow messaggi** (`sendMessage`):
1. Aggiungi il messaggio allo store locale con status "sending" (UI istantanea)
2. Chiama `api.sendMessage()` — il server risponde con il messaggio confermato
3. Il server emette il messaggio via socket a tutti i partecipanti
4. I listener socket aggiornano lo store quando arrivano messaggi da altri

**Socket listeners da registrare** (in una funzione `setupSocketListeners`):
```typescript
socket.on("message", (message) => {
  // Aggiungi messaggio allo store locale
  // Aggiorna lastMessage e unreadCount della chat
});

socket.on("message:updated", (data) => {
  // Aggiorna messaggio modificato/eliminato
});

socket.on("message:status", (data) => {
  // Aggiorna status (delivered, read)
});

socket.on("typing", ({ chatId, userId, isTyping }) => {
  // Aggiorna typing indicators nella chat
});

socket.on("user:online", ({ userId, isOnline, lastSeen }) => {
  // Aggiorna stato online dell'utente
});

socket.on("chat:updated", (chat) => {
  // Aggiorna dati chat
});
```

**Azioni che ora chiamano il server**:
- `sendMessage` → `api.sendMessage()` + aggiornamento locale ottimistico
- `editMessage` → `api.editMessage()`
- `deleteMessage` → `api.deleteMessage()`
- `reactToMessage` → `api.reactToMessage()`
- `markAsRead` → `api.markAsRead()`
- `createPrivateChat` → `api.createPrivateChat()`
- `createGroupChat` → `api.createGroupChat()`
- `pinChat/muteChat/archiveChat` → `api.updateChatSettings()`
- `deleteChat` → `api.deleteChat()`
- `addContact` → `api.addContact()`
- `removeContact` → `api.removeContact()`
- `blockContact` → `api.toggleBlock()`
- `findOrCreateUser` → ELIMINARE, sostituire con `searchUsers`
- `findUserByUsername` → ELIMINARE, sostituire con `searchUsers`
- `updateProfile` → `api.updateUser()` + aggiornamento locale

#### 4. `src/app/add-contact.tsx` (MODIFICARE)

Cambiare `findOrCreateUser` con una chiamata a `api.searchUsers(query)`. La ricerca ora interroga il database reale del server, non crea utenti finti.

```typescript
const handleSearch = async () => {
  if (!query.trim()) return;
  setSearching(true);
  const results = await api.searchUsers(query.trim());
  setFoundUser(results && results.length > 0 ? results[0] : null);
  setSearched(true);
  setSearching(false);
};
```

#### 5. `src/app/chat/[id].tsx` (MODIFICARE)

- All'apertura della chat, caricare i messaggi dal server: `api.getMessages(chatId)`
- Emettere typing events: `emitTyping(chatId, true/false)` dal ChatInput
- Il `markAsRead` ora chiama il server

#### 6. `src/app/_layout.tsx` (MODIFICARE)

Dopo l'hydration e l'init, connettere il socket:

```typescript
useEffect(() => {
  if (hydrated && currentUser) {
    // Socket già connesso dall'initialize, ma se l'app riparte:
    connectSocket(currentUser.id);
  }
  return () => disconnectSocket();
}, [hydrated, currentUser]);
```

### Dipendenze da installare

```bash
npx expo install socket.io-client
```

`socket.io-client` è puro JavaScript, funziona con Expo Go senza native modules.

### Interfaccia TypeScript (NON cambiare)

I tipi in `src/types/index.ts` NON devono cambiare — il backend usa lo stesso schema. Le interfacce `User`, `Message`, `Chat`, `Contact`, `Call` restano identiche.

### Cose importanti

1. **Aggiornamento ottimistico**: quando l'utente manda un messaggio, mostralo subito nella UI (status "sending"), poi aggiorna quando il server conferma
2. **Riconnessione**: se il socket si disconnette, riconnettere automaticamente e ricaricare gli ultimi messaggi
3. **NON rompere la UI**: tutti i componenti (ChatListItem, MessageBubble, ChatInput, ecc.) leggono da `useStore()` — finché il formato dei dati nello store resta lo stesso, la UI funziona
4. **Settings restano locali**: wallpaper, fontSize, readReceipts ecc. non vanno mai al server
5. **Typing con debounce**: emettere `typing:start` quando l'utente scrive, `typing:stop` dopo 2 secondi di inattività
6. **Il server gestisce gli ID chat private** come `chat_{id1}_{id2}` (ordinati) — stessa logica del `generateChatId` attuale

### Test

Dopo aver fatto le modifiche:
1. `npx tsc --noEmit` — deve compilare senza errori
2. Assicurati che il server backend sia raggiungibile: `curl http://TUO_SERVER_IP:3000/api/users/search?q=test`
3. L'app deve:
   - All'avvio, registrarsi al server
   - Poter cercare utenti reali (quelli registrati su altri telefoni)
   - Mandare messaggi che arrivano in real-time sull'altro telefono
   - Mostrare typing indicators e stato online
