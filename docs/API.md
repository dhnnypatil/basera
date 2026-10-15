# Basera REST API

Base URL (local): `http://localhost:8080/api`

All requests and responses use JSON. The website and the API share the same business logic
(`services/`) and the same login session, so anything you can do on the site you can also do here.

---

## 1. What is a REST API?

**REST** (Representational State Transfer) is a way of designing an API around **resources**
(things like *listings* and *bookings*) instead of actions.

| Idea | What it means here |
|---|---|
| **Resources have URLs** | `/api/listings` is the collection, `/api/listings/42` is one listing |
| **HTTP methods are the verbs** | `GET` reads, `POST` creates, `PUT` updates, `DELETE` removes |
| **Status codes tell you what happened** | `200 OK`, `201 Created`, `404 Not Found`, ... |
| **Stateless requests** | Every request carries everything needed (here: the session cookie identifies you) |
| **JSON representations** | The server sends back a JSON *representation* of the resource |

So instead of URLs like `/getAllListings` or `/deleteListing?id=42`, we use
`GET /api/listings` and `DELETE /api/listings/42`.

## 2. CRUD ↔ HTTP mapping

| CRUD | HTTP method | Example | Success code |
|---|---|---|---|
| **C**reate | `POST` | `POST /api/listings` | `201 Created` |
| **R**ead | `GET` | `GET /api/listings`, `GET /api/listings/:id` | `200 OK` |
| **U**pdate | `PUT` | `PUT /api/listings/:id` | `200 OK` |
| **D**elete (destroy) | `DELETE` | `DELETE /api/listings/:id` | `204 No Content` |

## 3. Status codes used

| Code | Meaning | When you get it |
|---|---|---|
| `200` | OK | Successful read / update |
| `201` | Created | A new listing, booking or user was created (`Location` header points to it) |
| `204` | No Content | Successful delete / logout - nothing to send back |
| `400` | Bad Request | Validation failed (e.g. negative price, check-out before check-in) |
| `401` | Unauthorized | You are not logged in, or wrong username/password |
| `403` | Forbidden | Logged in, but not allowed (e.g. a customer creating a listing, editing someone else's listing) |
| `404` | Not Found | The id doesn't exist |
| `409` | Conflict | Username/email taken, or the booking dates overlap an existing booking |
| `500` | Server Error | Something unexpected broke |

Every error response has the same shape:

```json
{ "error": "Sorry, those dates are already booked. Please pick different dates." }
```

## 4. How a request flows through the code

```
HTTP request
  -> routes/api/listings.js          which URL + method, and which middleware to run
  -> middleware/auth.js              isLoggedIn, isHost, isListingOwner ...   (401 / 403 / 404)
  -> middleware/validate.js          Joi schema from validators/schemas.js     (400)
  -> controllers/api/listings.js     reads req, calls the service, sends JSON + status code
  -> services/listingService.js      the actual rules (shared with the website)
  -> models/listing.js               Mongoose -> MongoDB
```

Any error thrown along the way lands in the error handler at the bottom of `app.js`, which turns it into `{ "error": "..." }` with the right status code.

---

## 5. Authentication - `/api/auth`

The API uses a **session cookie**. Log in once; your client (browser, Postman, Thunder Client, `curl -c/-b`) sends the cookie automatically on later requests.

| Method | Path | Body | Success |
|---|---|---|---|
| `POST` | `/api/auth/signup` | `{ "username", "email", "password", "role": "customer" \| "host" }` | `201` `{ user }` |
| `POST` | `/api/auth/login` | `{ "username", "password" }` | `200` `{ user }` |
| `POST` | `/api/auth/logout` | - | `204` |
| `GET` | `/api/auth/me` | - | `200` `{ user }` |

```bash
# Log in as the demo host and save the cookie to host.txt
curl -c host.txt -H "Content-Type: application/json" \
     -d '{"username":"demohost","password":"password123"}' \
     http://localhost:8080/api/auth/login
```

```json
{ "user": { "_id": "665f...", "username": "demohost", "email": "host@basera.dev", "role": "host" } }
```

---

## 6. Listings - `/api/listings`

| Method | Path | Who | CRUD | Success |
|---|---|---|---|---|
| `GET` | `/api/listings` | anyone | Read all | `200` `{ count, listings }` |
| `GET` | `/api/listings/:id` | anyone | Read one | `200` `{ listing }` |
| `POST` | `/api/listings` | host | Create | `201` `{ listing }` |
| `PUT` | `/api/listings/:id` | the listing's owner | Update | `200` `{ listing }` |
| `DELETE` | `/api/listings/:id` | the listing's owner | Delete | `204` |

### Search & filter (query string on `GET /api/listings`)

| Param | Example | Meaning |
|---|---|---|
| `q` | `goa` | Text search in title, location and country |
| `category` | `Beach` | One of: Rooms, Iconic Cities, Mountains, Beach, Castles, Camping, Pools, Farmhouse, Arctic, Treehouse |
| `minPrice`, `maxPrice` | `1000`, `3000` | Price-per-night range (₹) |
| `guests` | `4` | Only places that fit at least this many guests |
| `checkIn`, `checkOut` | `2026-12-10`, `2026-12-14` | Only places **free** for these dates |
| `sort` | `price_asc` | `newest` (default), `price_asc`, `price_desc`, `rating` |

```bash
curl "http://localhost:8080/api/listings?category=Beach&maxPrice=3000&sort=price_asc"
```

### Create a listing

The body is wrapped in a `listing` object (same shape the HTML form sends):

```bash
curl -b host.txt -H "Content-Type: application/json" -X POST http://localhost:8080/api/listings -d '{
  "listing": {
    "title": "Sea-view Villa",
    "description": "Steps from the beach",
    "location": "Calangute, Goa",
    "country": "India",
    "price": 4200,
    "category": "Beach",
    "maxGuests": 4,
    "image": { "url": "https://images.unsplash.com/photo-1566073771259-6a8506099945" }
  }
}'
```

`201 Created` + `Location: /api/listings/<id>`:

```json
{
  "listing": {
    "_id": "6ad12ceb4bbb580ca16e7df8",
    "title": "Sea-view Villa",
    "price": 4200,
    "location": "Calangute, Goa",
    "country": "India",
    "category": "Beach",
    "maxGuests": 4,
    "owner": "6ad12cd64bbb580ca16e7d70",
    "geometry": { "type": "Point", "coordinates": [73.76, 15.54] },
    "reviews": [],
    "createdAt": "2026-10-16T10:00:00.000Z"
  }
}
```

Notes:
- `owner` is always the logged-in host - sending `"owner"` in the body is ignored (unknown fields are stripped by the validator).
- Coordinates are looked up automatically from the location (OpenStreetMap).
- To upload an image file instead of a URL, send `multipart/form-data` with the file in a field called `image` and the text fields as `listing[title]`, `listing[price]`, ...

### Update / delete

```bash
# PUT replaces the listing's editable fields - send all of them
curl -b host.txt -H "Content-Type: application/json" -X PUT http://localhost:8080/api/listings/<id> \
     -d '{"listing":{"title":"Sea-view Villa (renovated)","location":"Calangute, Goa","country":"India","price":4500,"category":"Beach","maxGuests":4}}'

curl -b host.txt -X DELETE http://localhost:8080/api/listings/<id>      # 204 - also deletes its reviews and bookings
```

---

## 7. Bookings - `/api/bookings`

| Method | Path | Who | CRUD | Success |
|---|---|---|---|---|
| `GET` | `/api/bookings` | logged in | Read all | `200` customer: their trips · host: bookings on their listings |
| `GET` | `/api/bookings/:id` | the guest or the listing's host | Read one | `200` `{ booking }` |
| `POST` | `/api/bookings` | customer | Create | `201` `{ booking }` |
| `PUT` | `/api/bookings/:id` | the guest | Update | `200` `{ booking }` |
| `DELETE` | `/api/bookings/:id` | the guest or the listing's host | Delete (cancel) | `200` `{ booking }` with `status: "cancelled"` |

### Create a booking

```bash
curl -c cust.txt -H "Content-Type: application/json" \
     -d '{"username":"democustomer","password":"password123"}' http://localhost:8080/api/auth/login

curl -b cust.txt -H "Content-Type: application/json" -X POST http://localhost:8080/api/bookings -d '{
  "booking": { "listing": "<listingId>", "checkIn": "2026-12-10", "checkOut": "2026-12-13", "guests": 2 }
}'
```

```json
{
  "booking": {
    "_id": "6ad12cee4bbb580ca16e7e08",
    "listing": "6ad12ceb4bbb580ca16e7df8",
    "guest": "6ad12cd74bbb580ca16e7d77",
    "checkIn": "2026-12-10T00:00:00.000Z",
    "checkOut": "2026-12-13T00:00:00.000Z",
    "guests": 2,
    "pricePerNight": 4200,
    "totalPrice": 13860,
    "status": "confirmed",
    "nights": 3
  }
}
```

Booking rules (enforced in `services/bookingService.js`):

| Rule | Error |
|---|---|
| Check-out must be after check-in | `400` |
| Check-in can't be in the past | `400` |
| Guests ≤ the listing's `maxGuests` | `400` |
| Hosts can't book (customers only) | `403` |
| Dates can't overlap another confirmed booking | `409 Conflict` |
| `totalPrice` = nights × price + 10% service fee - always calculated by the server | - |

### Why is DELETE a "soft delete" for bookings?

`DELETE /api/listings/:id` really removes the listing (a **hard delete**).
`DELETE /api/bookings/:id` keeps the record and sets `status: "cancelled"` (a **soft delete**), so both the guest and the host keep a history of what happened - that's what real booking systems do. The cancelled booking no longer blocks those dates.

---

## 8. Testing the API yourself

- **Postman / Thunder Client (VS Code):** call `POST /api/auth/login` first - the cookie is stored and sent automatically.
- **curl:** use `-c cookies.txt` to save the cookie when logging in and `-b cookies.txt` to send it afterwards (examples above).
- **Browser:** any `GET` endpoint can be opened directly, e.g. <http://localhost:8080/api/listings?sort=rating>.
