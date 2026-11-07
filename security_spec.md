# Security Specification & Threat Model

## 1. Data Invariants
1. `users/{userId}`:
   - A user profile can ONLY be read or written by the authenticated user whose `request.auth.uid == userId`.
   - The user cannot spoof another user's `id` or `email`.
   - Blanket reads and unauthenticated reads are strictly forbidden.
2. `buildings/{userId}`:
   - Every building document must have `ownerId == request.auth.uid` and path variable `userId == request.auth.uid`.
   - Only the authenticated owner can read, create, or update their own building and financial records.
   - Cross-tenant or cross-user data leakage is mathematically blocked.
   - All input IDs must be validated (`isValidId(userId)`).
   - Document creation must have valid schema keys, string lengths, and array size boundaries.

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read on User Profile**: Anonymous or null auth attempting `get /users/user_123`.
2. **Cross-User Profile Read**: `auth.uid = 'attacker'` attempting `get /users/victim_456`.
3. **Cross-User Profile Write**: `auth.uid = 'attacker'` attempting `set /users/victim_456` with victim's ID.
4. **Identity Spoofing in Building Document**: `auth.uid = 'attacker'` setting `ownerId: 'victim_456'` in `/buildings/attacker`.
5. **Cross-User Building Hijack**: `auth.uid = 'attacker'` attempting `set /buildings/victim_456`.
6. **Denial-of-Wallet Long ID Injection**: Attempting path with a 2KB junk string ID `users/{junk_id_1024_chars}`.
7. **Blanket Query / Collection Scraping**: Querying `collection('buildings')` without ownerId constraint.
8. **Shadow Field Injection**: Attempting to write unexpected sensitive admin flags like `{ isAdmin: true, role: 'superadmin' }`.
9. **Unverified Email Spoofing**: Attempting write operations when `request.auth.token.email_verified == false` (if strict email verification is required).
10. **Corrupted Type Injection**: Setting `settings: "not_an_object"` or `apartments: 12345`.
11. **Excessive Array Overflow Attack**: Submitting an array with > 500 oversized elements to exhaust database quotas.
12. **Cross-User Delete**: `auth.uid = 'attacker'` attempting `delete /buildings/victim_456`.
