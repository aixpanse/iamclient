# User Context Provider

This user context provider manages authentication state across your application. It provides a centralized way to handle user authentication, session management, and user data.

## Features

- **Centralized User State**: Access user data from any component using the `useUser` hook
- **Session Parameter Support**: Pass session tokens directly to the `useUser` hook
- **Automatic Session Management**: Handles session cookies and API communication
- **Loading States**: Provides loading indicators during authentication operations
- **Error Handling**: Built-in error handling for authentication failures
- **Automatic Initialization**: Checks for existing sessions on app load

## Setup

The `UserProvider` is already wrapped around your app in `app/layout.tsx`, so you can use the `useUser` hook in any component.

## Usage

### Basic Usage (No Session Parameter)

```tsx
'use client';
import { useUser } from '../lib/contexts/user-context';

function MyComponent() {
  const { user, isLoading, logout } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Usage with Session Parameter

```tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { useUser } from '../lib/contexts/user-context';

function LoginPage() {
  const searchParams = useSearchParams();
  const session = searchParams.get('session');
  
  // Automatically authenticates if session is provided
  const { user, isLoading, logout } = useUser(session || undefined);

  if (isLoading) {
    return <div>Authenticating...</div>;
  }

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome back, {user.email}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>Authentication failed or no session provided</p>
      )}
    </div>
  );
}
```

### Dynamic Session Usage

```tsx
'use client';
import { useState } from 'react';
import { useUser } from '../lib/contexts/user-context';

function AdminPanel() {
  const [adminSession, setAdminSession] = useState<string | undefined>();
  const { user, isLoading, refreshUser } = useUser(adminSession);

  const handleAdminLogin = (sessionToken: string) => {
    setAdminSession(sessionToken);
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Admin session token"
        onChange={(e) => setAdminSession(e.target.value)}
      />
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {user ? `Admin: ${user.email}` : 'Not authenticated'}
          <button onClick={() => refreshUser(adminSession)}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
```

### Available Context Values

```tsx
interface UserContextValue {
  user: User | null;                          // Current user data or null if not authenticated
  isLoading: boolean;                         // True during authentication operations
  login: (session: string) => Promise<void>; // Login with session token and redirect
  logout: () => Promise<void>;               // Logout and clear session
  refreshUser: (session?: string) => Promise<void>;     // Refresh user data from server
  setUserFromSession: (session: string) => Promise<void>; // Set user from session without redirect
}
```

### User Type

```tsx
interface User {
  $id: string;                 // User ID
  $createdAt: string;         // Account creation date
  $updatedAt: string;         // Last update date
  email: string;              // User email
  name?: string;              // Optional user name
  emailVerification: boolean; // Email verification status
}
```

## Hook Behavior

### `useUser()` - No Parameters
- Uses stored session cookie
- Returns current authenticated user or null

### `useUser(session)` - With Session Parameter
- Automatically authenticates using the provided session
- Updates the stored session cookie
- Fetches user data for the session
- Subsequent calls with the same session won't re-authenticate

## Example Components

### URL Session Handler
```tsx
'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '../lib/contexts/user-context';

function SessionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = searchParams.get('session');
  const { user, isLoading } = useUser(session || undefined);

  useEffect(() => {
    if (session && user) {
      // Remove session from URL after successful login
      router.replace('/dashboard');
    }
  }, [session, user, router]);

  if (isLoading) {
    return <div>Processing login...</div>;
  }

  return user ? (
    <div>Login successful! Redirecting...</div>
  ) : (
    <div>Login failed or no session provided</div>
  );
}
```

### Multi-Session Support
```tsx
'use client';
import { useState } from 'react';
import { useUser } from '../lib/contexts/user-context';

function MultiSessionDemo() {
  const [activeSession, setActiveSession] = useState<string>();
  const { user, isLoading } = useUser(activeSession);

  const sessions = [
    'session-token-1',
    'session-token-2',
    'session-token-3'
  ];

  return (
    <div>
      <h3>Select Session:</h3>
      {sessions.map(session => (
        <button 
          key={session}
          onClick={() => setActiveSession(session)}
          className="mr-2 p-2 bg-gray-200 rounded"
        >
          {session}
        </button>
      ))}
      
      <div className="mt-4">
        {isLoading ? (
          <div>Loading user for session...</div>
        ) : user ? (
          <div>Current user: {user.email}</div>
        ) : (
          <div>No user for selected session</div>
        )}
      </div>
    </div>
  );
}
```

## API Integration

The context provider communicates with your IAM server at `http://localhost:3000`. Make sure your IAM server is running and accessible.

### Endpoints Used
- `GET /api/account` - Fetch user data
- `POST /api/signout` - Sign out user

### Session Management
Sessions are stored in cookies using the `fe-chat-session` cookie name. The context provider automatically manages this cookie, but when a session parameter is provided to `useUser()`, it will update the stored cookie with the new session.

## Migration from Previous Version

If you were previously using the hook like this:
```tsx
const { user, login } = useUser();
await login(sessionToken);
```

You can now simplify it to:
```tsx
const { user } = useUser(sessionToken);
```

The authentication will happen automatically when the session parameter is provided.