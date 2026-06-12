# Changelog

All notable changes to the IYF Sadhana Tracker are documented here.

## 2026-06-13

### Added

- Added a dedicated student Messages page.
  - Students can now view conversations with admins from `/messages`.
  - Students can send messages to the selected admin.
  - The page supports multiple admin conversations when more than one admin has messaged the student.
  - Existing conversations can still render even when the admin profile lookup is unavailable, using a safe fallback admin label.

- Added admin-to-student message notification routing.
  - Admin messages now create notifications that link directly to `/messages?admin=<admin-id>`.
  - This gives the student message page enough context to open the correct conversation.

- Added an admin Sign Out action.
  - The admin desktop header now has a visible `Sign Out` button.
  - The admin mobile menu also includes `Sign Out`.
  - Sign out now calls `supabase.auth.signOut()` before redirecting to `/login`.

- Added the missing `pin_hash` field to the shared `Profile` type so profile and PIN-related UI can type-check correctly.

### Changed

- Reworked the color scheme from the previous warm gold/orange palette to a calmer garden palette.
  - Primary color is now a muted sage-teal.
  - Accent color is now a soft muted blue.
  - Backgrounds use gentle green and blue-tinted neutrals.
  - Borders, scrollbars, selection color, navbar glass, and the main `lotus-gradient` were updated to match.

- Replaced prominent orange/yellow pending and streak styling with calmer accent-based styling.
  - Pending cards and badges now use subtle accent backgrounds.
  - Streak indicators now use the app accent instead of orange.
  - Draft/completed challenge badges were adjusted to fit the new palette.

- Improved admin challenge management responsiveness.
  - Challenge cards now stack actions cleanly on small screens.
  - Create/Edit Challenge form fields use one-column layout on phones.
  - Report Form Builder controls stack cleanly on mobile.
  - Form builder previews avoid narrow two-column layouts on mobile.
  - Save/Cancel actions stack on narrow screens.

- Improved student challenge responsiveness.
  - Challenge detail dialogs use mobile-friendly dimensions.
  - Challenge cards wrap long titles, audience text, and date metadata.
  - Daily report form options avoid cramped two-column layouts on phones.
  - My Sadhana cards and action buttons stack cleanly on mobile.

- Improved shared dialog behavior.
  - Dialogs now render through a `document.body` portal.
  - This prevents dialogs from being trapped inside transformed page containers.
  - Fixed issue where modals appeared limited to a small scrollable area on smartphone viewport emulation.
  - Dialog overlay is now fixed to the viewport.
  - Mobile dialogs start near the top of the screen and use more available viewport space.

- Updated admin layout background to use the calm app gradient instead of the previous slate background.

### Fixed

- Fixed student message notifications where tapping `View` could appear to do nothing.
  - New message notifications now point to the student Messages page.
  - Existing/old message notifications that point back to `/notifications` are normalized to `/messages` at render time.

- Fixed student Messages page appearing empty even when the student had a message notification.
  - Message loading now uses message history plus notification/admin query context.
  - The selected admin is chosen from the notification query param, latest message, or available admin profiles.

- Fixed admin message links created from both the Admin Messages page and Student Detail page.

- Fixed challenge creation and edit modals on smartphone-sized screens.
  - The modals now use nearly the full mobile viewport instead of a small centered box.
  - The fix applies to Create Challenge, Edit Challenge, Requests, report details, student challenge details, and other shared dialogs.

- Fixed production build errors.
  - Added missing `Profile.pin_hash` type.
  - Removed `useSearchParams()` usage from dashboard pages to avoid missing Suspense boundary build failures in Next.js 16.

### Notes

- Admin authentication should remain email/password only.
  - PIN login is better suited as a student convenience feature.
  - Admin PIN setup/login should be disabled or ignored to avoid weakening admin account security.

- `npm run build` passes after the changes.

- `npm run lint` still reports existing broader lint issues across the codebase, including strict `no-explicit-any`, unescaped entity rules, and React lint rules around state updates in effects. These are not currently blocking production builds.
