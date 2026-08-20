# API Contracts: Freely Room Reservation

**Branch**: `025-freely-room-reservation` | **Date**: 2026-07-18

This directory documents the HTTP API contracts for the room reservation feature. All endpoints are prefixed with `/api/rooms` and mounted in `server/src/server.mjs`.

Existing endpoints (already implemented):
- `GET /api/rooms/details` — [contract-details.md](./contract-details.md)
- `GET /api/rooms/availability` — [contract-availability.md](./contract-availability.md)

New endpoint (to be implemented):
- `POST /api/rooms/reserve` — [contract-reserve.md](./contract-reserve.md)
