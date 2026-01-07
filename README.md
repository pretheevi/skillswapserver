# SkillSwap Server

Backend REST API for the SkillSwap platform (Node.js, Express, MongoDB).

## Quick start

Requirements:

- Node.js, npm
- MongoDB (local or Atlas)

Install and run:

```bash
cd server
npm install
cp .env.example .env   # create .env with required vars (or create manually)
npm run dev            # starts nodemon + index.js
```

Environment variables (minimum):

- `PORT` (e.g. 8080)
- `MONGO_URI` (MongoDB connection string)
- `JWT_SECRET` (secret for signing tokens)

## Base URL

All mounted routes use the `/api` prefix. Example base URL:

`http://localhost:8080/api`

## Endpoints (summary)

Auth

- POST `/api/register` — Register a new user
  - Body: `{ name, email, password }`
  - Response: `201 Created` on success
- POST `/api/login` — Login and receive JWT
  - Body: `{ email, password }`
  - Response: `200 OK` with `{ token, user }`

Skills (all under `/api`)

- GET `/api/skills` — List all skills (protected)
  - Requires `Authorization: Bearer <token>` header
- POST `/api/skills` — Create a new skill (protected)
  - Body: `{ title, description, level, category, ... }`
  - Response: `201 Created`
- GET `/api/skills/:id` — Get a single skill (protected)
- GET `/api/my-skills` — Get skills owned by the logged-in user (protected)
- PUT `/api/skills/:id` — Update a skill (protected, owner only)
- DELETE `/api/skills/:id` — Delete a skill (protected, owner only)

Comments

- POST `/api/comment` — Create a comment for a skill (protected)
  - Body: `{ text, skill }` where `skill` is the skill `_id`
  - Response: `201 Created`

Notes

- All protected routes expect the header: `Authorization: Bearer <JWT_TOKEN>`
- The project mounts routes at `/api` in `index.js` (see `authentication`, `dashboard/home/skills`, `dashboard/home/commet`).
- There is a `dashboard/home/users.js` file that defines `GET /users` but it is not mounted in `index.js` by default.

## Examples (curl)

Register:

```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret"}'
```

Login (get token):

```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret"}'
```

Create a skill (replace TOKEN):

```bash
curl -X POST http://localhost:8080/api/skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"React Basics","description":"Intro to React","level":"beginner","category":"Web"}'
```

Add a comment (replace TOKEN):

```bash
curl -X POST http://localhost:8080/api/comment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"text":"Nice session","skill":"<SKILL_ID>"}'
```

## Where to look in the code

- Main server: `index.js`
- Auth routes: `authentication/auth.js`
- Skills routes: `dashboard/home/skills.js`
- Comment route: `dashboard/home/commet.js`
- JWT helper/middleware: `middleware/jwt.js`
