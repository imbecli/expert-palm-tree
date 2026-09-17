# expert-palm-tree

Local-only prototype for listing and creating IT devices.

This repository began as an unfinished inventory scaffold. Most of the original tree was empty route files, unused mock pages, placeholder "manager" modules, or a committed `project.zip` that included `node_modules`. Those have been removed. What remains is one Express app with an in-memory store.

## Status

Working as a local prototype, not as a product:

- You can list, create, edit, and delete devices
- Data lives in process memory and is lost when the server stops
- There is no authentication and no user accounts
- The server binds to `127.0.0.1` by default
- Assignment, reporting, notifications, collaboration, MongoDB, and EJS views are not implemented

Do not expose this process on a network.

## Run

```bash
npm install
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Optional environment variables:

- `PORT` - listen port, default `3000`
- `HOST` - bind address, default `127.0.0.1`

If you set `HOST` to anything other than localhost, the process warns and still has no authentication.

## Test

```bash
npm test
```

The test script runs isolated in-memory checks. It does not connect to MongoDB and does not delete data from any database.

## API

Same-origin JSON only. There is no open CORS middleware.

- `GET /api/devices`
- `POST /api/devices`
- `GET /api/devices/:id`
- `PUT /api/devices/:id`
- `DELETE /api/devices/:id`

Example:

```bash
curl -X POST http://127.0.0.1:3000/api/devices \
  -H 'Content-Type: application/json' \
  -d '{"deviceType":"Laptop","serialNumber":"LAP-001","condition":"Good"}'
```

Required fields: `deviceType`, `serialNumber`. Optional: `condition` (`New`, `Good`, `Fair`, `Poor`), `status` (`Available`, `Assigned`), `notes`.

## What was removed

- Empty `routes/*.js` files that crashed `npm start` when mounted
- `res.render('dashboard')` without a configured view engine
- Wide-open `cors()` with no auth
- Committed `project.zip` (it contained a nested `node_modules` tree)
- Nested `it-inventory` package
- `test.js`, which connected to MongoDB and called `deleteMany`
- Unused mock HTML, empty JavaScript stubs, and unused EJS views

## What this is not

This is not an enterprise inventory platform. The original filenames suggested analytics, collaboration, security, export, and WebSockets. Those files were empty and have not been rebuilt.
