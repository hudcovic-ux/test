# Snadnee Client Space (SCS)

Klientský portál pro správu tiketů s integrací do YouTrack.

## Funkce

- Autentizace pomocí email/heslo s pozvánkovým systémem
- Dashboard s pohledem seznam a kanban
- Detail tiketu s inline editací
- Systém komentářů (pouze veřejné)
- In-app a emailové notifikace
- Admin panel pro správu organizací

## Technologie

- Next.js 14 (App Router)
- TypeScript
- Prisma + PostgreSQL
- NextAuth.js v5
- Tailwind CSS + Shadcn/ui
- Docker

## Instalace

### 1. Naklonuj repozitář

```bash
git clone <repo-url>
cd scs
```

### 2. Nainstaluj závislosti

```bash
npm install
```

### 3. Nastav prostředí

```bash
cp .env.example .env
```

Uprav `.env` soubor s tvými hodnotami:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - náhodný řetězec pro session
- `YOUTRACK_URL` - URL tvé YouTrack instance
- `YOUTRACK_TOKEN` - YouTrack API token
- SMTP konfigurace pro emaily

### 4. Spusť databázové migrace

```bash
npx prisma migrate dev
```

### 5. Spusť vývojový server

```bash
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## Docker Deployment

```bash
docker-compose up -d
```

## Vytvoření prvního admin uživatele

Po prvním spuštění je potřeba vytvořit organizaci a SUPER_ADMIN uživatele přímo v databázi:

```sql
-- Vytvoř organizaci
INSERT INTO "Organization" (id, name, "youtrackClient", "createdAt", "updatedAt")
VALUES ('org1', 'Moje Firma', 'MojaFirma', NOW(), NOW());

-- Vytvoř admin uživatele (heslo je zahashované pomocí bcrypt)
INSERT INTO "User" (id, email, "passwordHash", name, role, "organizationId", "createdAt", "updatedAt")
VALUES ('user1', 'admin@example.com', '$2a$12$...', 'Admin', 'SUPER_ADMIN', 'org1', NOW(), NOW());
```

## Licence

Proprietární
