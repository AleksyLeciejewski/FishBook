# FishBook - Arkitektur Dokumentation

## Oversigt

FishBook er en webapplikation til fiskere, hvor de kan logge deres fangster, planlægge ture og dele oplevelser. Applikationen er bygget med **Node.js/Express** og følger **MVC (Model-View-Controller)** arkitekturmønsteret.

---

## Arkitekturdiagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KLIENT (Browser)                               │
│                         HTML/CSS/JavaScript + EJS                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXPRESS SERVER (app.js)                          │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Middleware │  │   Session   │  │   Static    │  │   Error     │        │
│  │  (auth.js)  │  │   Handler   │  │   Files     │  │   Handler   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROUTES (routes/)                               │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ auth.js  │ │catches.js│ │ trips.js │ │ users.js │ │ admins.js│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONTROLLERS (controllers/)                         │
│                                                                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                  │
│  │authController  │ │catchController │ │tripController  │                  │
│  └────────────────┘ └────────────────┘ └────────────────┘                  │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                  │
│  │userController  │ │adminController │ │draftController │                  │
│  └────────────────┘ └────────────────┘ └────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
                          │                       │
                          ▼                       ▼
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│         MODELS (models/)           │  │          VIEWS (views/)            │
│                                    │  │                                    │
│  ┌──────────┐  ┌──────────┐       │  │  ┌──────────┐  ┌──────────┐       │
│  │ User.js  │  │ Catch.js │       │  │  │ auth/    │  │ catches/ │       │
│  └──────────┘  └──────────┘       │  │  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐       │  │  ┌──────────┐  ┌──────────┐       │
│  │ Trip.js  │  │ Draft.js │       │  │  │ trips/   │  │ users/   │       │
│  └──────────┘  └──────────┘       │  │  └──────────┘  └──────────┘       │
│  ┌──────────────────────┐         │  │  ┌──────────┐  ┌──────────┐       │
│  │   fishingSpots.js    │         │  │  │ partials/│  │ admin/   │       │
│  └──────────────────────┘         │  │  └──────────┘  └──────────┘       │
└────────────────────────────────────┘  └────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE (MongoDB)                             │
│                            via Mongoose ODM                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## MVC Arkitektur

### Model (models/)

Modellerne definerer datastrukturen og interagerer med MongoDB via Mongoose.

| Model | Fil | Beskrivelse |
|-------|-----|-------------|
| **User** | `models/User.js` | Brugerdata, autentificering, profil |
| **Catch** | `models/Catch.js` | Fangster med lokation, vægt, art |
| **Trip** | `models/Trip.js` | Fisketure med deltagere og fangster |
| **Draft** | `models/Draft.js` | Kladder til fangster/ture |
| **FishingSpot** | `models/fishingSpots.js` | Fiskepladser med koordinater |

**Eksempel - Catch Model:**
```javascript
// models/Catch.js
const catchSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    species: { type: String, required: true },
    weight: { type: Number, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
        name: { type: String, required: true }
    },
    // ...
});
```

---

### View (views/)

Views er EJS-templates der renderer HTML til klienten.

| Mappe | Indhold |
|-------|---------|
| `views/auth/` | Login og registrering |
| `views/catches/` | Fangst-sider (liste, detalje, opret) |
| `views/trips/` | Ture-sider |
| `views/users/` | Brugerprofiler |
| `views/admin/` | Admin dashboard |
| `views/partials/` | Genbrugelige komponenter (header, footer) |

---

### Controller (controllers/)

Controllers håndterer forretningslogik og forbinder Models med Views.

| Controller | Fil | Ansvar |
|------------|-----|--------|
| **authController** | `controllers/authController.js` | Login, logout, registrering |
| **catchController** | `controllers/catchController.js` | CRUD for fangster |
| **tripController** | `controllers/tripController.js` | CRUD for ture |
| **userController** | `controllers/userController.js` | Brugerprofiler, indstillinger |
| **adminController** | `controllers/adminController.js` | Admin funktioner |
| **draftController** | `controllers/draftController.js` | Kladde-håndtering |

**Eksempel - Controller funktion:**
```javascript
// controllers/catchController.js
export const renderCatchesIndex = async (req, res) => {
    const catches = await Catch.find({ isPublic: true })
        .populate('user', 'username profilePicture')
        .sort({ dateCaught: -1 });
    
    res.render('catches/index', {
        title: 'All Catches',
        catches
    });
};
```

---

## Request Flow (MVC i praksis)

```
1. KLIENT sender HTTP request
         │
         ▼
2. ROUTE modtager request og kalder controller
   routes/catches.js: router.get('/', renderCatchesIndex)
         │
         ▼
3. CONTROLLER henter data fra MODEL
   catchController.js: await Catch.find({ isPublic: true })
         │
         ▼
4. MODEL interagerer med DATABASE
   Catch.js → MongoDB
         │
         ▼
5. CONTROLLER sender data til VIEW
   res.render('catches/index', { catches })
         │
         ▼
6. VIEW renderer HTML og sender til KLIENT
   views/catches/index.ejs → HTML
```

---

## Mappestruktur

```
FishBook/
├── app.js                 # Express server setup
├── controllers/           # Business logic (C)
│   ├── authController.js
│   ├── catchController.js
│   ├── tripController.js
│   └── ...
├── models/                # Data schemas (M)
│   ├── User.js
│   ├── Catch.js
│   ├── Trip.js
│   └── ...
├── views/                 # EJS templates (V)
│   ├── auth/
│   ├── catches/
│   ├── trips/
│   └── partials/
├── routes/                # URL routing
│   ├── auth.js
│   ├── catches.js
│   └── ...
├── middleware/            # Auth & validation
│   ├── auth.js
│   ├── sessionAuth.js
│   └── ...
├── services/              # External services
│   └── weatherService.js
├── public/                # Static files
│   ├── js/
│   ├── images/
│   └── uploads/
└── tests/                 # Test filer
```

---

## Teknologi Stack

| Lag | Teknologi |
|-----|-----------|
| **Frontend** | EJS, HTML, CSS, JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Autentificering** | Express-session + connect-mongo |
| **File Upload** | Multer |
| **Validering** | Express-validator |

---

## Fordele ved MVC

1. **Separation of Concerns** - Klar adskillelse mellem data, logik og præsentation
2. **Vedligeholdelse** - Nemmere at ændre én del uden at påvirke andre
3. **Testbarhed** - Controllers og Models kan testes isoleret
4. **Skalerbarhed** - Nye features kan tilføjes uden at omstrukturere
5. **Teamwork** - Forskellige udviklere kan arbejde på M, V eller C samtidigt
