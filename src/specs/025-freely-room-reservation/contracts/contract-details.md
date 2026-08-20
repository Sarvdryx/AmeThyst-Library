# GET /api/rooms/details

**Status**: Already implemented (existing endpoint)

## Request

| Parameter | Type | Location | Required | Description |
|---|---|---|---|---|
| `roomId` | integer | query | conditional | Room ID (required if no `name`) |
| `name` | string | query | conditional | Room name (requires `branchId`) |
| `branchId` | integer | query | conditional | Branch ID (required with `name`) |

## Response (200)

```json
{
  "success": true,
  "data": {
    "roomId": 1,
    "branchId": 1,
    "roomName": "Conference Room C1",
    "tvNum": 1,
    "boardNum": 1,
    "socketNum": 4,
    "projectorNum": 1,
    "imgUrl": "https://res.cloudinary.com/...",
    "capacity": 6,
    "description": "A quiet conference room on the first floor."
  }
}
```

## Error Response (400/404/500)

```json
{
  "success": false,
  "error": "Room not found."
}
```
