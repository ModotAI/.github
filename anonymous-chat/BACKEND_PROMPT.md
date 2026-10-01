# Prompt per Claude Code — Backend Chat Anonima

Copia e incolla questo prompt in Claude Code sul tuo server.

---

## PROMPT

Crea un backend completo per un'app di messaggistica anonima. Il backend deve usare **Node.js + Express + Socket.IO + PostgreSQL**. L'app mobile Expo si collegherà a questo server.

### Requisiti tecnici

- **Runtime**: Node.js (usa TypeScript)
- **Framework**: Express per le API REST
- **Real-time**: Socket.IO per messaggi, typing, online status
- **Database**: PostgreSQL (crea il database `anonchat` se non esiste)
- **Auth**: Nessuna registrazione tradizionale. Ogni dispositivo genera un ID anonimo (`anon_xxxx`) al primo avvio e si registra con quello. Il server crea il record utente se non esiste.
- **Porta**: 3000 (configurabile via env `PORT`)
- **CORS**: Permetti tutte le origini (l'app mobile si collega da qualsiasi IP)

### Schema Database PostgreSQL

```sql
CREATE DATABASE anonchat;

CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- es: "anon_abc123def456"
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT 'Hey there! I''m anonymous',
  last_seen BIGINT DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  created_at BIGINT NOT NULL
);

CREATE TABLE contacts (
  owner_id TEXT REFERENCES users(id),
  contact_id TEXT REFERENCES users(id),
  nickname TEXT,
  is_blocked BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  added_at BIGINT NOT NULL,
  PRIMARY KEY (owner_id, contact_id)
);

CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('private', 'group')),
  name TEXT,
  description TEXT,
  avatar TEXT,
  created_by TEXT REFERENCES users(id),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE chat_participants (
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  is_admin BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  unread_count INTEGER DEFAULT 0,
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id),
  text TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  media_thumbnail TEXT,
  media_duration INTEGER,
  media_width INTEGER,
  media_height INTEGER,
  waveform JSONB,
  file_name TEXT,
  file_size BIGINT,
  sticker TEXT,
  reply_to TEXT,
  forwarded BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'sent',
  reactions JSONB DEFAULT '{}',
  created_at BIGINT NOT NULL,
  edited_at BIGINT,
  deleted_at BIGINT
);

CREATE TABLE message_read_by (
  message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE calls (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('voice', 'video')),
  caller_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'ringing',
  started_at BIGINT NOT NULL,
  ended_at BIGINT,
  duration INTEGER
);

CREATE TABLE call_participants (
  call_id TEXT REFERENCES calls(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  PRIMARY KEY (call_id, user_id)
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
```

### API REST Endpoints

Tutte le rotte sotto `/api`. L'header `x-user-id` identifica l'utente (il dispositivo lo manda con ogni richiesta).

#### Auth / Users
- `POST /api/auth/register` — body: `{ id, username, displayName }`. Crea utente se non esiste, restituisce l'utente.
- `GET /api/users/search?q=xxx` — cerca utenti per username o ID (LIKE query). Non restituire l'utente stesso.
- `GET /api/users/:id` — profilo utente
- `PATCH /api/users/:id` — aggiorna profilo (displayName, bio, avatar)

#### Contacts
- `GET /api/contacts` — lista contatti dell'utente
- `POST /api/contacts` — body: `{ contactId }`. Aggiunge contatto.
- `DELETE /api/contacts/:contactId` — rimuove contatto
- `PATCH /api/contacts/:contactId/block` — toggle blocco
- `PATCH /api/contacts/:contactId/favorite` — toggle preferito

#### Chats
- `GET /api/chats` — lista chat dell'utente (con ultimo messaggio e unread count)
- `POST /api/chats/private` — body: `{ otherUserId }`. Crea o restituisce chat privata esistente.
- `POST /api/chats/group` — body: `{ name, participantIds }`. Crea gruppo.
- `PATCH /api/chats/:chatId` — aggiorna chat (pin, mute, archive per l'utente)
- `DELETE /api/chats/:chatId` — elimina chat

#### Messages
- `GET /api/chats/:chatId/messages?before=timestamp&limit=50` — messaggi con paginazione
- `POST /api/chats/:chatId/messages` — invia messaggio
- `PATCH /api/messages/:messageId` — modifica messaggio (solo testo)
- `DELETE /api/messages/:messageId` — elimina messaggio (body: `{ forEveryone }`)
- `POST /api/messages/:messageId/react` — body: `{ emoji }`. Toggle reazione.
- `POST /api/chats/:chatId/read` — segna tutti come letti

#### Calls
- `GET /api/calls` — cronologia chiamate
- `POST /api/calls` — avvia chiamata

### Socket.IO Events

Il client si connette con `{ auth: { userId: "anon_xxx" } }`.

#### Server emette:
- `message` — nuovo messaggio (a tutti i partecipanti della chat)
- `message:updated` — messaggio modificato/eliminato
- `message:status` — cambio status (delivered, read)
- `typing` — utente sta scrivendo `{ chatId, userId, isTyping }`
- `user:online` — cambio stato online `{ userId, isOnline, lastSeen }`
- `chat:updated` — aggiornamento chat

#### Client emette:
- `message:send` — invia messaggio
- `message:delivered` — conferma ricezione
- `message:read` — conferma lettura
- `typing:start` — inizio digitazione `{ chatId }`
- `typing:stop` — fine digitazione `{ chatId }`

### Gestione Online Status

- Quando un socket si connette: imposta `is_online = true` nel DB, emetti `user:online` ai contatti
- Quando si disconnette: imposta `is_online = false`, aggiorna `last_seen`, emetti `user:online`
- Ogni utente entra in una room Socket.IO `user:{userId}` per ricevere i suoi messaggi

### Gestione Chat Private

Per le chat private, l'ID è deterministico: `chat_{id1}_{id2}` dove id1 e id2 sono ordinati alfabeticamente. Questo evita duplicati.

### Struttura progetto

```
server/
  package.json
  tsconfig.json
  src/
    index.ts          -- entry point, Express + Socket.IO setup
    db.ts             -- pool PostgreSQL + query helper
    schema.sql        -- DDL completo (eseguito all'avvio se le tabelle non esistono)
    routes/
      auth.ts
      users.ts
      contacts.ts
      chats.ts
      messages.ts
      calls.ts
    socket/
      index.ts        -- handler Socket.IO
      handlers.ts     -- logica eventi
    middleware/
      auth.ts         -- estrae x-user-id dall'header
```

### Configurazione

Usa variabili d'ambiente (con dotenv):

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/anonchat
```

### Istruzioni

1. Crea la cartella `server/` nella directory corrente
2. Inizializza con `npm init -y` e installa le dipendenze: `express`, `socket.io`, `pg`, `cors`, `dotenv`, `typescript`, `@types/express`, `@types/pg`, `@types/cors`, `tsx`
3. Crea tutto il codice
4. Nello script `start` del package.json usa `tsx src/index.ts`
5. All'avvio il server deve: connettersi a PostgreSQL, creare le tabelle se non esistono (usando schema.sql), avviare Express + Socket.IO
6. Testa che il server parta correttamente
7. Stampa l'URL del server all'avvio: `Server running on http://0.0.0.0:3000`

### Importante

- NON usare ORM — query SQL dirette con `pg`
- Il server deve funzionare senza configurazione iniziale oltre al DATABASE_URL
- Gestisci gli errori con risposte JSON `{ error: "message" }`
- Log minimali ma utili (connessioni socket, errori)
- Il server DEVE essere robusto — gestire disconnessioni, query fallite, input malformato
