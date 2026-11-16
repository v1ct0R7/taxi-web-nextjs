# Skema e databazës (MySQL + Sequelize)

Databaza ka 7 tabela. Backend-i i krijon vetë kur niset (`sequelize.sync()`), kështu që mjafton të krijosh databazën bosh dhe të vendosësh të dhënat në `backend/.env`. Skedari [`schema.sql`](./schema.sql) ka të njëjtën skemë në SQL, për referencë ose për krijim manual.

## Diagrami ER

```mermaid
erDiagram
    DRIVERS ||--o{ RIDES : "merr (driver_id)"
    CITY_ROUTES ||--o{ RIDES : "tarifa fikse (city_route_id)"
    RIDES ||--o| RETURN_PROMOS : "krijon ofertën (source_ride_id)"
    RETURN_PROMOS |o--o| RIDES : "rezervohet nga (claimed_ride_id / promo_id)"
    DRIVERS ||--o{ RETURN_PROMOS : "shoferi i kthimit"
    CITY_ROUTES ||--o{ RETURN_PROMOS : "çmimi i kthimit"
    RIDES ||--o{ ACTIVITY_LOGS : "historia (ride_id)"

    ADMINS {
        int id PK
        varchar name
        varchar email UK
        varchar password "bcrypt"
    }
    DRIVERS {
        int id PK
        varchar name
        varchar phone UK "+3556XXXXXXXX"
        varchar password "bcrypt"
        varchar car_model
        varchar plate_number UK
        enum status "offline | available | busy"
        bool active "admini e çaktivizon"
        datetime last_seen_at
    }
    CITY_ROUTES {
        int id PK
        varchar city UK "Durrës, Vlorë…"
        decimal price "Tiranë → qytet"
        decimal return_price "qytet → Tiranë (ofertë)"
        int duration_minutes
        int distance_km
        bool active
    }
    RIDES {
        int id PK
        varchar access_code "sekreti i klientit për status/anulim"
        varchar phone "klienti — pa llogari"
        enum type "city | intercity | return_promo"
        enum status "pending | accepted | picked_up | completed | cancelled"
        varchar origin_city
        varchar destination_city
        varchar pickup_address
        decimal pickup_lat
        decimal pickup_lng
        varchar dropoff_address
        decimal dropoff_lat
        decimal dropoff_lng
        decimal distance_km
        decimal price
        varchar note
        enum cancelled_by "client | driver | admin | system"
        varchar cancel_reason
        int driver_id FK
        int city_route_id FK
        int promo_id "oferta që u rezervua"
        datetime accepted_at
        datetime picked_up_at
        datetime completed_at
        datetime cancelled_at
    }
    RETURN_PROMOS {
        int id PK
        int source_ride_id FK "udhëtimi Tiranë → qytet"
        int driver_id FK
        int city_route_id FK
        int claimed_ride_id "udhëtimi i kthimit"
        varchar from_city
        varchar to_city "Tiranë"
        decimal price
        decimal regular_price
        datetime available_from "kur mbërrin shoferi"
        datetime expires_at
        enum status "active | claimed | expired | cancelled"
    }
    ACTIVITY_LOGS {
        int id PK
        enum actor_type "client | driver | admin | system"
        varchar actor_id
        varchar action "ride_requested, ride_accepted…"
        varchar details
        int ride_id
        datetime created_at
    }
    SETTINGS {
        int id PK "gjithmonë 1"
        decimal base_fare
        decimal per_km
        decimal minimum_fare
        int promo_window_hours
        varchar support_phone
    }
```

## Tabelat

| Tabela | Çfarë ruan | Model Sequelize |
|---|---|---|
| `admins` | Llogaritë e administratorëve (email + fjalëkalim bcrypt) | `models/adminModel.js` |
| `drivers` | Shoferët: telefoni (për hyrje), makina, targa, statusi live | `models/driverModel.js` |
| `city_routes` | Tarifat fikse Tiranë → qytet dhe çmimi i kthimit | `models/cityRouteModel.js` |
| `rides` | Çdo porosi e klientit, nga kërkesa deri në drop-off ose anulim | `models/rideModel.js` |
| `return_promos` | Ofertat e kthimit qytet → Tiranë | `models/returnPromoModel.js` |
| `activity_logs` | Çdo veprim në sistem, për panelin admin | `models/activityLogModel.js` |
| `settings` | Një rresht me tarifat brenda Tiranës | `models/settingModel.js` |

## Lidhjet (`models/index.js`)

| Lidhja | Kolona | Kur fshihet prindi |
|---|---|---|
| `drivers 1 — N rides` | `rides.driver_id` | `SET NULL` (porosia mbetet në histori) |
| `city_routes 1 — N rides` | `rides.city_route_id` | `SET NULL` |
| `rides 1 — 1 return_promos` | `return_promos.source_ride_id` | `SET NULL` |
| `drivers 1 — N return_promos` | `return_promos.driver_id` | `SET NULL` |
| `city_routes 1 — N return_promos` | `return_promos.city_route_id` | `SET NULL` |
| `return_promos ↔ rides` (rezervimi) | `return_promos.claimed_ride_id`, `rides.promo_id` | pa FK (lidhje ciklike) |
| `rides 1 — N activity_logs` | `activity_logs.ride_id` | pa FK (log-u ruhet gjithmonë) |

## Statuset e porosisë

```mermaid
stateDiagram-v2
    [*] --> pending: klienti porosit
    pending --> accepted: shoferi pranon
    pending --> cancelled: klienti / admini anulon, ose 30 min pa shofer
    accepted --> picked_up: shoferi merr klientin
    accepted --> cancelled: klienti / shoferi / admini anulon
    picked_up --> completed: shoferi bën drop-off
    picked_up --> cancelled: vetëm admini
    completed --> [*]
    cancelled --> [*]
```

Statusi i shoferit lëviz bashkë me porosinë: `available` → (pranon) → `busy` → (drop-off ose anulim) → `available`. Shoferi kalon vetë `available` ↔ `offline` vetëm kur nuk ka udhëtim aktiv.

## Oferta e kthimit

```mermaid
stateDiagram-v2
    [*] --> active: shoferi pranon Tiranë → qytet
    active --> claimed: një klient e rezervon
    claimed --> active: klienti anulon (nëse s'ka skaduar)
    claimed --> cancelled: shoferi e refuzon
    active --> expired: kalon afati
    active --> cancelled: udhëtimi Tiranë → qytet anulohet
    claimed --> cancelled: udhëtimi Tiranë → qytet anulohet
```

- `available_from` = koha e pranimit + `city_routes.duration_minutes` (kur mbërrin shoferi në qytet)
- `expires_at` = `available_from` + `settings.promo_window_hours`
- Kërkesa e kthimit krijohet si `rides.type = 'return_promo'` me `driver_id` të vendosur, ndaj e sheh **vetëm ai shofer**.
