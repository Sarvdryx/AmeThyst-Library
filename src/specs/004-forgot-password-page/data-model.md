# Data Model: Forgot Password Feature

## Reset Request

Represents a user's intent to reset their password.

- **email** (String, required): The email address of the account requesting a password reset. Must be a valid email format.
- **timestamp** (Date, required): The time the request was initiated. Used to enforce request expiration.
- **status** (String, enum): 'pending', 'processed', 'expired'. Default: 'pending'.

## Validation Rules

- **Email**: Must conform to standard email regex.
- **Timestamp**: Must not be in the future.
