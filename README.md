# Basera 🧭

> **Basera** (बसेरा) - *a home, a place to settle for a while.*

An Airbnb-style stay booking platform built with **Node.js, Express, MongoDB (Mongoose) and EJS**.

People sign up as one of two roles - just like Unstop's *Candidate / Recruiter* login:

| Role | Can do |
|---|---|
| **Customer** | Search & filter stays, book them, change dates, cancel, write reviews |
| **Host (Admin)** | List places, edit & delete them, see every booking on their places, cancel bookings, see earnings |

Everything is available both as a **website** and as a **JSON REST API** (see [docs/API.md](docs/API.md)).

---

## Quick start (zero setup)

```bash
npm install
npm run dev        # or: npm start
```

Open **http://localhost:8080**.

With no `.env` file the app starts a temporary **in-memory MongoDB** and fills it with demo data, so you don't need to install MongoDB or create any accounts. (Data resets on every restart.)

| Demo account | Username | Password |
|---|---|---|
| Customer | `democustomer` | `password123` |
| Host | `demohost` | `password123` |

### Using a real database (data that persists)

1. Copy `.env.example` to `.env`
2. Set `MONGO_URL` (local `mongodb://127.0.0.1:27017/basera` or a MongoDB Atlas URL) and `SESSION_SECRET`
3. `npm run seed` to load the demo data, then `npm start`

Optional: set the `CLOUD_*` variables to store uploaded photos on Cloudinary instead of `public/uploads`.

---

## Deploying (Render + MongoDB Atlas + Cloudinary - all free tiers)

1. **MongoDB Atlas** - create a free M0 cluster, add a database user, allow network access from `0.0.0.0/0`, and copy the connection string ending in `/basera`.
2. **Cloudinary** - copy your cloud name, API key and API secret. *Required in production:* Render's disk is wiped on every restart, so locally saved uploads would disappear.
3. **Seed the live database (optional)** - put the Atlas URL in your local `.env` as `MONGO_URL` and run `npm run seed`.
4. **Render** - New → Web Service → connect this GitHub repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variables:

     | Variable | Value |
     |---|---|
     | `NODE_ENV` | `production` |
     | `MONGO_URL` | your Atlas connection string |
     | `SESSION_SECRET` | output of `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
     | `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | from Cloudinary |

5. **Test** - sign up, create a listing with a photo, book it as a customer, refresh and make sure you're still logged in.

In production the app refuses to start without `MONGO_URL` or `SESSION_SECRET` (with a clear error in the Render logs), and session cookies are HTTPS-only.

> Render's free tier sleeps after 15 minutes without traffic; the first visit afterwards takes ~30-50 seconds. Open the site a minute before a demo.

---

## Features

**Website**
- Home page with hero search (place, dates, guests), categories, top-rated stays, and Customer vs Host intro
- Listings page with filters: text search, category, price range, guests, **availability for your dates**, and sorting (newest / price / top rated)
- Listing page with photo, host, map (OpenStreetMap), already-booked dates, reviews, and a booking card with a live price breakdown
- Signup / login with **Customer / Host role tabs**
- **Customers:** "My trips" - upcoming & past bookings, change dates, cancel
- **Hosts:** dashboard with stats (listings, upcoming bookings, earnings), all bookings received, and listing management

**Backend**
- Full CRUD for listings and bookings, plus reviews and users
- JSON REST API under `/api` with proper status codes ([docs/API.md](docs/API.md))
- Role-based authorization (host vs customer) and ownership checks
- Booking rules: no past dates, guest limit, **no overlapping bookings (409 Conflict)**, server-side price calculation
- Request validation with Joi (unknown fields stripped, so nobody can set `owner` or `totalPrice` themselves)
- One central error handler: HTML error pages for the site, `{ "error": "..." }` JSON for the API

---

## Project structure

```
Basera/
├── server.js                 Entry point: load .env -> connect DB -> start app
├── app.js                    Express setup: middleware -> routes -> error handler
│
├── config/                   One-time setup
│   ├── db.js                 MongoDB connection (real DB or in-memory demo DB)
│   ├── passport.js           Login strategy (passport-local)
│   └── upload.js             Image uploads (Cloudinary or local disk)
│
├── models/                   Mongoose schemas = shape of the data in MongoDB
│   ├── user.js               username, email, role (host | customer), hashed password
│   ├── listing.js            title, price, location, category, owner, reviews ...
│   ├── booking.js            listing, guest, checkIn, checkOut, totalPrice, status
│   └── review.js             rating, comment, author
│
├── routes/                   URL + HTTP method -> middleware -> controller
│   ├── pages.js              GET /
│   ├── listings.js           /listings
│   ├── reviews.js            /listings/:id/reviews
│   ├── bookings.js           /bookings
│   ├── dashboard.js          /dashboard
│   ├── users.js              /signup /login /logout
│   └── api/                  /api/... (JSON)
│       ├── index.js
│       ├── auth.js
│       ├── listings.js
│       └── bookings.js
│
├── middleware/
│   ├── auth.js               isLoggedIn, isHost, isCustomer, isListingOwner, canAccessBooking ...
│   └── validate.js           runs a Joi schema against req.body
│
├── validators/
│   └── schemas.js            Joi rules for listing, booking, review, signup
│
├── controllers/              Read the request, call a service, send a response
│   ├── listings.js           website (renders EJS pages)
│   ├── bookings.js
│   ├── reviews.js
│   ├── dashboard.js
│   ├── users.js
│   ├── pages.js
│   └── api/                  API (sends JSON + status codes)
│       ├── auth.js
│       ├── listings.js
│       └── bookings.js
│
├── services/                 Business logic, shared by website AND API
│   ├── listingService.js     search/filter, create, update, delete
│   ├── bookingService.js     availability, pricing, create/update/cancel
│   ├── reviewService.js
│   └── authService.js
│
├── utils/                    ExpressError, wrapAsync, geocode, helpers, constants
├── seeds/                    Demo data + `npm run seed`
├── views/                    EJS templates (layouts, includes, pages per feature)
├── public/                   CSS, browser JS, uploaded images
└── docs/API.md               REST API reference
```

### How one request travels through the app (MVC + service layer)

```
Browser / Postman
   │   POST /bookings   { booking: { listing, checkIn, checkOut, guests } }
   ▼
routes/bookings.js          router.post("/", isLoggedIn, isCustomer, validate(bookingSchema), controller.create)
   ▼
middleware/auth.js          isLoggedIn -> 401/redirect,  isCustomer -> 403
middleware/validate.js      Joi check -> 400 if dates/guests are invalid
   ▼
controllers/bookings.js     const booking = await bookingService.createBooking(...)
   ▼
services/bookingService.js  past date? too many guests? overlapping booking? -> calculate price
   ▼
models/booking.js           Booking.create(...) -> MongoDB
   ▼
controller responds:        website -> flash + redirect to /bookings
                            API     -> 201 Created + JSON
```

- **Model** = data & database rules
- **View** = EJS templates (the website's HTML)
- **Controller** = handles one request/response
- **Service** = the business rules, written once and reused by both website and API controllers

---

## CRUD at a glance

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Listing | `POST /listings` (host) | `GET /listings`, `GET /listings/:id` | `PUT /listings/:id` (owner) | `DELETE /listings/:id` (owner, hard delete + cascade) |
| Booking | `POST /bookings` (customer) | `GET /bookings` (my trips), `GET /dashboard` (host) | `PUT /bookings/:id` (guest) | `DELETE /bookings/:id` (guest or host, soft delete = cancelled) |
| Review | `POST /listings/:id/reviews` (customer) | shown on the listing page | - | `DELETE /listings/:id/reviews/:reviewId` (author) |
| User | `POST /signup` | `GET /api/auth/me` | - | - |

HTML forms can only send `GET` and `POST`, so edit/delete forms use `?_method=PUT` / `?_method=DELETE` ([method-override](https://www.npmjs.com/package/method-override)). The API uses the real HTTP methods.

---

## What changed from v1

| Area | Before | Now |
|---|---|---|
| Name | LocalLiving | Basera |
| Security | `isOwner` never awaited the query and its condition was inverted - **any logged-in user could edit or delete any listing** | Fixed ownership checks + role checks on every route |
| Roles | One kind of user | Customer / Host roles with Unstop-style login tabs |
| Bookings | None | Full booking system with availability, pricing, edit and cancel |
| API | HTML only | JSON REST API with status codes + docs |
| Structure | Logic inside controllers | Routes -> middleware -> controllers -> **services** -> models |
| Validation | `price` validated as a string; any field could be set | Proper types; unknown fields (like `owner`) stripped |
| Setup | Needed Atlas + Cloudinary + Mapbox keys | Runs with no keys (in-memory DB, local uploads, OpenStreetMap) |
| Logout | `GET /logout` | `POST /logout` (can't be triggered by a link on another site) |
| Misc | Hardcoded session secret, review dates all the same (`Date.now()` evaluated once), crash on bad ids | Env-based secret, `timestamps`, bad ids -> 404 |
