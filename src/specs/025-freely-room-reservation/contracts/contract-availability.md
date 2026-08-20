# GET /api/rooms/availability

**Status**: Already implemented (existing endpoint)

## Request

| Parameter | Type | Location | Required | Description |
|---|---|---|---|---|
| `roomId` | integer | query | yes | Target room ID |
| `date` | string | query | yes | Date in `YYYY-MM-DD` format |

## Response (200)

```json
{
  "success": true,
  "data": [
    {
      "availId": 1,
      "startTime": "07:30:00",
      "endTime": "10:30:00",
      "status": "free",
      "reserveId": null
    },
    {
      "availId": 2,
      "startTime": "10:30:00",
      "endTime": "12:30:00",
      "status": "reserved",
      "reserveId": "uuid-string"
    }
  ]
}
```

## Status Values

| Value | Meaning |
|---|---|
| `free` | Slot is available for booking |
| `reserved` | Slot is already booked by another user |
| `pending` | Slot has a pending booking |

## Error Response (400/500)

```json
{
  "success": false,
  "error": "Invalid roomId or date parameter format."
}
```
