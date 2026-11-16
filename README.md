# Tirana Ride — sistem porosie taksie

Projekt i plotë me React + Express + MySQL (Sequelize):

- **Klienti** porosit taksi vetëm me numrin e telefonit dhe vendndodhjen në hartë, sheh çmimin para porosisë, ndjek shoferin live dhe mund ta anulojë porosinë.
- **Shoferi** ka aplikacionin e vet: kalon *Në dispozicion / Jashtë linje*, merr kërkesat me tingull, i pranon, merr klientin, bën drop-off dhe kthehet automatikisht në dispozicion.
- **Admini** sheh çdo porosi, çdo shofer dhe çdo veprim live, menaxhon shoferët, tarifat e qyteteve dhe cilësimet.
- **Ofertat e kthimit:** kur një taksi niset nga Tirana drejt një qyteti tjetër, kthimi shfaqet për të gjithë si ofertë me çmim të ulët. Kushdo në atë qytet mund ta rezervojë.

## Struktura

```text
backend/   API — Express + Sequelize + MySQL          http://localhost:4000
client/    Faqja e klientëve (React + Vite)            http://localhost:5173
admin/     Paneli i administratorit (React + Vite)     http://localhost:5174
driver/    Aplikacioni i shoferit (React + Vite)       http://localhost:5175
docs/      Skema e backend-it, e databazës dhe schema.sql
taxi-web/  Faqja e vjetër prezantuese (Next.js) — e paprekur
```

Dokumentimi: [docs/BACKEND.md](docs/BACKEND.md) · [docs/DATABASE.md](docs/DATABASE.md) · [docs/schema.sql](docs/schema.sql)

## Kërkesat

- Node.js 20.19+ (ose 22.12+) dhe npm
- MySQL 8 (ose MariaDB 10.6+)

## Nisja lokale

1. Krijo databazën bosh në MySQL:

```sql
CREATE DATABASE taxi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

2. Instalo paketat:

```bash
cd backend && npm install
cd ../client && npm install
cd ../admin && npm install
cd ../driver && npm install
```

3. Krijo skedarët `.env`:

```bash
cp -n backend/.env.example backend/.env
cp -n client/.env.example client/.env
cp -n admin/.env.example admin/.env
cp -n driver/.env.example driver/.env
```

Te `backend/.env` vendos `DB_USER`, `DB_PASSWORD`, një `JWT_SECRET` të gjatë dhe `ADMIN_EMAIL` / `ADMIN_PASSWORD` (min. 8 karaktere).

4. Krijo tabelat, administratorin dhe tarifat fillestare:

```bash
cd backend && npm run seed -- --demo
```

`--demo` shton edhe 3 shoferë testues (`069 111 1111`, `069 222 2222`, `069 333 3333`, fjalëkalimi `shofer123`). Hiqe në prodhim.

5. Nise secilin shërbim në terminal më vete:

```bash
cd backend && npm run dev
cd client && npm run dev
cd admin && npm run dev
cd driver && npm run dev
```

## Si ta provosh

1. Hap **driver** (5175), hyr si shofer dhe kalo *Në dispozicion*.
2. Hap **client** (5173), shkruaj një numër telefoni, kliko dy pika në hartë dhe porosit.
3. Te shoferi del kërkesa me tingull → *Prano* → *Klienti hipi* → *Drop off*. Klienti e sheh çdo hap live.
4. Porosit nga klienti *Jashtë Tiranës*. Pasi shoferi e pranon, te *Ofertat e kthimit* del kthimi me çmim të ulët.
5. Hap **admin** (5174) për të parë porositë, aktivitetin, shoferët, tarifat dhe ofertat.

Tarifat e qyteteve janë vlera fillestare. Ndryshoji te *Admin → Tarifat e qyteteve*.

## Kontrolli i cilësisë

```bash
cd backend && npm test
cd client && npm run lint && npm run build
cd admin && npm run lint && npm run build
cd driver && npm run lint && npm run build
```

## Shënime për deploy

- Mos bëj commit `.env`. Vendos sekretet te host-i.
- `CORS_ORIGINS` duhet të ketë vetëm domenet reale të client, admin dhe driver.
- Përdor HTTPS: vendndodhja e telefonit (*Përdor vendndodhjen time*) funksionon vetëm në HTTPS.
- Harta përdor OpenStreetMap/CARTO dhe kërkimi i adresave Nominatim (falas, për trafik të ulët). Për trafik të madh, kalo te një ofrues me çelës (Mapbox, Google).
