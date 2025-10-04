# @vector/types

This package defines the **shared type interfaces** between the Rails API and the React client.

It acts as the **contract layer** to ensure both the backend and frontend remain in sync, typed, and safe to evolve.

---

## Purpose

- Serve as the single source of truth for **request payloads**, **response shapes**, and **domain models**
- Improve developer experience with autocompletion and type safety
- Prevent type drift and reduce duplication across apps

---

## Directory Structure

```
src/
├── auth/             # Auth-related types (login, refresh, session)
│   ├── login.ts
│   ├── refresh.ts
├── user/             # User domain types
│   ├── user.ts
├── reward/           # Reward domain types
│   ├── reward.ts
├── shared/           # Generic/shared primitives (e.g., ApiError, ID)
│   ├── api-error.ts
│   ├── id.ts
index.ts              # Barrel export file
```

---

## Type Examples

### `LoginRequest`

```ts
export interface LoginRequest {
  email: string;
  password: string;
}
```

### `ApiError`

```ts
export interface ApiError {
  status: number;
  message: string;
  code: string;
  errors?: { field: string; message: string }[];
}
```

---

## Usage Example

```ts
import type { LoginRequest, ApiError } from '@vector/types';
```

---

## Future Considerations
