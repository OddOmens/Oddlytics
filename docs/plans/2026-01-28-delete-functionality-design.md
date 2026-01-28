# Delete Functionality Design

**Date:** 2026-01-28
**Status:** Approved

## Overview

Add permanent data deletion capabilities to the Oddlytics dashboard, allowing users to delete individual events, all events for a user, or all events for an app. All deletions require confirmation and are permanent database operations.

## Scope

Users can delete:
- **Individual events** - Single event from activity feeds
- **All events for a user** - Complete user data removal by user_id
- **All events for an app** - Wipe all analytics data for an app_id

## Architecture

### 1. API Layer (Backend)

**New DELETE Endpoints** (packages/worker/src/index.ts):

```
DELETE /events/:eventId
- Deletes a single event by ID
- Returns: { success: true, deleted: 1 }
- Error: 404 if event not found

DELETE /users/:userId
- Deletes ALL events where user_id matches
- Returns: { success: true, deleted: <count> }
- Returns count even if 0

DELETE /apps/:appId
- Deletes ALL events where app_id matches
- Returns: { success: true, deleted: <count> }
- Returns count even if 0
```

**Authentication:**
- All endpoints require X-API-KEY header
- Must match AUTH_KEY environment variable
- Return 401 for unauthorized requests

**SQL Operations:**
```sql
-- Individual event
DELETE FROM events WHERE id = ?

-- User events
DELETE FROM events WHERE user_id = ?

-- App events
DELETE FROM events WHERE app_id = ?
```

**Implementation:**
- Use D1's `run()` method
- Return `meta.changes` as deleted count
- Wrap in try-catch for 500 errors

### 2. Frontend API Client

**New Methods** (packages/dashboard/src/lib/api.ts):

```typescript
deleteEvent(eventId: number): Promise<{ success: boolean, deleted: number }>
deleteUser(userId: string): Promise<{ success: boolean, deleted: number }>
deleteApp(appId: string): Promise<{ success: boolean, deleted: number }>
```

Each method:
- Calls respective DELETE endpoint
- Includes API key header
- Returns deletion confirmation

### 3. UI Components

**Reusable Confirmation Dialog** (new file):

`packages/dashboard/src/components/DeleteConfirmDialog.tsx`

- Props: `open`, `onClose`, `onConfirm`, `title`, `message`, `isDeleting`
- Uses Tremor Dialog component (consistent with rename dialog)
- Red destructive styling for Delete button
- Loading state prevents accidental double-deletion
- Always cancellable

**Delete Button Locations:**

1. **User Activity Feed** (packages/dashboard/src/app/users/detail/page.tsx)
   - Trash icon next to each event
   - Hover reveals button (opacity transition)
   - Confirmation: "Delete this event? This cannot be undone."

2. **User Detail Page** (same file)
   - "Delete User Data" button in header/stats area
   - Confirmation: "Delete all events for user {userId}? This will permanently delete {count} events."

3. **App Dashboard** (packages/dashboard/src/app/apps/client.tsx)
   - "Delete App Data" button in header
   - Confirmation: "Delete all events for app {appId}? This will permanently delete {count} events."

**Icon:** Use Trash2 from lucide-react for consistency.

## User Flow

1. User clicks delete button (trash icon or "Delete" button)
2. Confirmation dialog appears with:
   - Clear title (e.g., "Delete Event")
   - Warning message with what will be deleted
   - Count of items if bulk operation
   - Cancel (gray) and Delete (red) buttons
3. User clicks Delete
4. Button shows loading state ("Deleting...")
5. API request executes deletion
6. On success:
   - Dialog closes
   - UI updates (removes item or navigates away)
   - Optional: Show success toast
7. On error:
   - Show error message in dialog
   - Keep dialog open for retry

## Data Flow

```
UI Component → DeleteConfirmDialog → api.deleteX() →
Worker DELETE endpoint → D1 Database →
Success response → Update UI → Close dialog
```

## Error Handling

- **401 Unauthorized**: Show "Authentication failed" error
- **404 Not Found** (individual event): Show "Event not found"
- **500 Server Error**: Show "Failed to delete, please try again"
- Network errors: Show "Connection failed, check your network"

## Security Considerations

- All DELETE endpoints require authentication
- No cascade deletes (only events table affected)
- Permanent deletions (no soft delete/undo)
- User confirmation required before execution

## Testing Checklist

- [ ] Delete individual event removes it from database
- [ ] Delete individual event updates UI immediately
- [ ] Delete user removes all events for that user_id
- [ ] Delete app removes all events for that app_id
- [ ] Deleted counts are accurate
- [ ] Confirmation dialog prevents accidental deletion
- [ ] Loading state prevents double-deletion
- [ ] 401 error shown for missing API key
- [ ] 404 error shown for non-existent event
- [ ] Error messages are user-friendly
- [ ] Dialog closes on successful deletion
- [ ] Cancel button works at all times
