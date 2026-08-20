# Data Model: Study Together - Study Group

## Entities

### StudyGroup
- **id**: `string` - Unique identifier for the group
- **subject**: `string` - The category/subject of the group (e.g., "Computer Science", "Physics")
- **title**: `string` - Name of the study group (e.g., "Algorithms & Logic")
- **description**: `string` - Brief summary of what the group does
- **leader**: `object` - The group leader's info
  - **name**: `string` - Full name of the leader
  - **initials**: `string` - Initials for the avatar
- **time**: `string` - Time slot of the study group (e.g., "5:00 PM - 9:00 PM")
- **address**: `string` - The location address of the study group
- **room**: `string` - The room number or name
- **currentMembers**: `number` - Number of participants currently in the group
- **maxMembers**: `number` - Total capacity of the group
- **status**: `string` - Derived field. "Available" if `currentMembers < maxMembers`, else "Full"

## State Transitions
- **Join Action**: Clicking "Join Group" transitions the UI state to display the "Request to Join" modal.
- **Modal Submission**: Clicking "Send" in the modal triggers a success feedback (toast/alert) and closes the modal, simulating a join request sent to the server.
