# Data Model: Profile

## Profile Entity
- **fullName**: string (Required)
- **email**: string (Required, validated format)
- **role**: string (Required, e.g., 'Student', 'Faculty')
- **faculty**: string (Optional, default: 'Not provided')
- **bio**: string (Optional, default: 'Not provided')
- **phoneNumber**: string (Optional, default: 'Not provided')

## Validation Rules
- All required fields must be non-empty strings.
- Email must follow standard email format.
