# API Documentation

## Overview

- **Base URL:** `https://api.siodelhi.org/api`
- **Auth method:** Bearer JWT (Clerk RS256)
- **Response format:** JSON
- **Error format:** `{ "error": "message" }`
- **CORS:** Allowed for `siodelhi.org`, `sio-delhi.github.io`, `local.siodelhi.org`, and localhost origins
- **Rate limits:** 10 req/min on login, 60 req/min on write operations per IP
- **Body size limit:** 1 MB for POST/PUT (except uploads and avatar)

Auth column: No = public route, Yes = requires `Authorization: Bearer <token>` header.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check returning API and database connection status |

---

## Sections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sections` | No | List all sections |
| GET | `/sections/{id}` | No | Get a single section by ID |
| POST | `/sections` | Yes | Create a new section |
| PUT | `/sections/{id}` | Yes | Update a section |
| DELETE | `/sections/{id}` | Yes | Delete a section |

---

## Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/posts` | No | List all posts |
| GET | `/posts/{id}` | No | Get a single post by ID |
| POST | `/posts` | Yes | Create a new post |
| PUT | `/posts/{id}` | Yes | Update a post |
| DELETE | `/posts/{id}` | Yes | Delete a post |

---

## Popups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/popups` | Yes | List all popups |
| GET | `/popups/active` | No | Get currently active popups |
| GET | `/popups/{id}` | Yes | Get a single popup by ID |
| POST | `/popups` | Yes | Create a new popup |
| PUT | `/popups/{id}` | Yes | Update a popup |
| DELETE | `/popups/{id}` | Yes | Delete a popup |
| DELETE | `/popups/clear` | Yes | Delete all popups |

---

## Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload/image` | Yes* | Upload an image file |
| POST | `/upload/pdf` | Yes* | Upload a PDF file |
| POST | `/upload/audio` | Yes* | Upload an audio file |
| DELETE | `/upload/{type}/{filename}` | Yes | Delete an uploaded file |
| GET | `/download/{type}/{filename}` | No | Download a file by type and filename |

> \* Upload endpoints become public when a `formId` field is present in the POST body (for public form submissions).

---

## Stats

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats` | Yes | Get all aggregated stats |
| GET | `/stats/storage` | Yes | Get storage usage stats |
| GET | `/stats/database` | Yes | Get database size and table stats |

---

## Frame Tool

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/frame/apply-bulk` | Yes | Apply a frame to multiple images in bulk |

---

## Garbage Collector

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/garbage` | Yes | List orphaned files not referenced in the database |
| POST | `/garbage/cleanup` | Yes | Delete orphaned files |

---

## Forms

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/forms` | Yes | List all forms |
| GET | `/forms/public/{slug}` | No | Get a published form by slug (public view) |
| GET | `/forms/{id}/responses/{responseId}` | Yes | Get a single form response |
| GET | `/forms/{id}/responses` | Yes | List all responses for a form |
| GET | `/forms/{id}/export` | Yes | Export form responses (e.g. CSV) |
| GET | `/forms/{id}` | Yes | Get a form by ID (admin view) |
| POST | `/forms` | Yes | Create a new form |
| POST | `/forms/{id}/submit` | No | Submit a response to a form |
| PUT | `/forms/{id}/fields` | Yes | Update fields/schema of a form |
| PUT | `/forms/{id}/responses/{responseId}` | Yes | Update a form response |
| PUT | `/forms/{id}` | Yes | Update form metadata |
| DELETE | `/forms/{id}/responses/{responseId}` | Yes | Delete a form response |
| DELETE | `/forms/{id}` | Yes | Delete a form |

---

## Portal

All portal endpoints require authentication unless noted otherwise.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/portal/setup` | Yes | Initial portal setup/provisioning |
| POST | `/portal/seed` | Yes | Seed portal with initial data |
| POST | `/portal/auth/me` | Yes | Authenticate current user and return profile (rate-limited: 10/min) |

### Units

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/units` | Yes | List all units |
| GET | `/portal/units/{id}/members` | Yes | List members of a unit |
| GET | `/portal/units/{id}` | Yes | Get a single unit by ID |
| POST | `/portal/units` | Yes | Create one or more units |
| PUT | `/portal/units/{id}` | Yes | Update a unit |
| DELETE | `/portal/units/{id}` | Yes | Delete a unit |

### Circles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/circles` | Yes | List all circles |
| GET | `/portal/circles/{id}/members` | Yes | List members of a circle |
| GET | `/portal/circles/{id}` | Yes | Get a single circle by ID |
| POST | `/portal/circles` | Yes | Create one or more circles |
| PUT | `/portal/circles/{id}` | Yes | Update a circle |
| DELETE | `/portal/circles/{id}` | Yes | Delete a circle |

### Campuses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/campuses` | Yes | List all campuses |
| GET | `/portal/campuses/{id}/members` | Yes | List members of a campus |
| GET | `/portal/campuses/{id}` | Yes | Get a single campus by ID |
| POST | `/portal/campuses` | Yes | Create one or more campuses |
| PUT | `/portal/campuses/{id}` | Yes | Update a campus |
| DELETE | `/portal/campuses/{id}` | Yes | Delete a campus |

### Regions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/regions` | Yes | List all regions |
| GET | `/portal/regions/{id}/units` | Yes | Get units belonging to a region |
| POST | `/portal/regions` | Yes | Create one or more regions |
| PUT | `/portal/regions/{id}` | Yes | Update a region |
| DELETE | `/portal/regions/{id}` | Yes | Delete a region |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/users` | Yes | List all users |
| GET | `/portal/users/{id}` | Yes | Get a single user by ID |
| POST | `/portal/users` | Yes | Create one or more users |
| PUT | `/portal/users/{id}` | Yes | Update a user |
| DELETE | `/portal/users/{id}` | Yes | Delete a user |
| PUT | `/portal/users/{id}/title` | Yes | Assign a title/role to a user |
| DELETE | `/portal/users/{id}/title` | Yes | Revoke a user's title/role |
| POST | `/portal/users/{id}/avatar` | Yes | Upload a user avatar |
| DELETE | `/portal/users/{id}/avatar` | Yes | Delete a user's avatar |
| PUT | `/portal/users/{id}/lock` | Yes | Lock a user account |
| PUT | `/portal/users/{id}/revoke` | Yes | Revoke a user's access |
| POST | `/portal/users/{id}/reset-password` | Yes | Reset a user's password |

### Messages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/messages` | Yes | List all messages |
| GET | `/portal/users/{id}/messages` | Yes | Get messages for a specific user |
| POST | `/portal/messages` | Yes | Send a message |
| PUT | `/portal/messages/{id}/read` | Yes | Mark a message as read |

### Performance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/users/{id}/performance` | Yes | Get performance data for a user |
| GET | `/portal/performance/forms` | Yes | List all performance forms |
| GET | `/portal/performance/forms/{id}` | Yes | Get a performance form by ID |
| POST | `/portal/performance/forms` | Yes | Create a performance form |
| PUT | `/portal/performance/forms/{id}` | Yes | Update a performance form |
| DELETE | `/portal/performance/forms/{id}` | Yes | Delete a performance form |
| GET | `/portal/performance/forms/{id}/responses/{userId}/reviews` | Yes | Get reviews for a user's performance response |
| POST | `/portal/performance/forms/{id}/responses/{userId}/reviews` | Yes | Create or update a review for a performance response |
| GET | `/portal/performance/forms/{id}/responses` | Yes | List responses for a performance form |
| POST | `/portal/performance/forms/{id}/seen` | Yes | Mark a performance form as seen |
| POST | `/portal/performance/forms/{id}/respond` | Yes | Submit a response to a performance form |
| PUT | `/portal/performance/reviews/{id}` | Yes | Update a performance review |
| DELETE | `/portal/performance/reviews/{id}` | Yes | Delete a performance review |

### Migrations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/users/{id}/migrations` | Yes | Get migration history for a user |
| GET | `/portal/migrations` | Yes | List all pending migrations |
| POST | `/portal/migrations` | Yes | Create a migration request |
| POST | `/portal/migrations/mark-seen` | Yes | Mark migrations as seen |
| PUT | `/portal/migrations/{id}` | Yes | Resolve a migration (approve/reject) |

### Edit Requests

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/users/{id}/edit-requests` | Yes | Get edit requests for a member |
| GET | `/portal/edit-requests` | Yes | List all pending edit requests |
| POST | `/portal/edit-requests` | Yes | Create an edit request |
| PUT | `/portal/edit-requests/{id}` | Yes | Resolve an edit request (approve/reject) |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/dashboard/stats` | Yes | Get dashboard summary statistics |
| GET | `/portal/region-units-without-president` | Yes | List units in a region that have no president assigned |
| GET | `/portal/retiring-members` | Yes | List members approaching retirement |
| GET | `/portal/members-incomplete-details` | Yes | List members with incomplete profile details |
| GET | `/portal/search` | Yes | Global search across portal entities |
| GET | `/portal/notifications` | Yes | Get notification counts (edit requests, migrations, etc.) |

---

## Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/analytics/track` | No | Track a page visit |
| POST | `/analytics/duration` | No | Record visit duration |
| POST | `/analytics/heartbeat` | No | Heartbeat to keep a visit session alive |
| GET | `/analytics/live` | Yes | Get count of live/active visitors |
| GET | `/analytics/stats` | Yes | Get aggregated visit statistics |
| GET | `/analytics/locations` | Yes | Get visitor location data |
