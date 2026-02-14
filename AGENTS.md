# AGENTS.md - Agentic Coding Guidelines

## Project Overview

**MortgageConnect** - A full-stack mortgage broker platform with:
- **Mobile App**: React Native + Expo + TypeScript (main customer app)
- **Admin Dashboard**: Next.js 16 + React 19 (internal admin panel)
- **Cloud Functions**: Firebase Functions (Node.js 20) for OTP emails

## Commands

### Mobile App (Root)

```bash
# Development
npm run start          # Start Expo dev server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator (Mac only)
npm run web            # Run in browser

# Code Quality
npm run lint           # Run ESLint + Prettier check
npm run format         # Auto-fix ESLint issues + format with Prettier

# Build
npm run prebuild       # Generate native project files
```

### Admin Dashboard (`cd admin`)

```bash
npm run dev            # Start Next.js dev server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
```

### Cloud Functions (`cd functions`)

```bash
npm run build          # Compile TypeScript
npm run serve          # Local emulator with hot reload
npm run deploy         # Deploy to Firebase
npm run logs           # View function logs
```

### Testing

**No testing framework is currently configured.** If adding tests:
- Jest is recommended for React Native/Expo projects
- Use `__tests__/` directory or `.test.ts(x)` naming

## Code Style Guidelines

### General

- **TypeScript**: Strict mode enabled - always define types for function parameters and returns
- **Single quotes**: Use `'` not `"` (Prettier enforced)
- **Trailing commas**: ES5 style (Prettier enforced)
- **Line width**: 100 characters max
- **Indent**: 2 spaces

### Imports

```typescript
// 1. External libraries (alphabetical)
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';

// 2. Internal absolute imports (alphabetical, @/ prefix)
import { Button } from '@/components/Button';
import { db } from '@/src/services/firebase';

// 3. Internal relative imports (for same-directory files)
import { MyComponent } from './MyComponent';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile`, `AgentCard` |
| Functions | camelCase | `fetchAgents`, `handleSubmit` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY` |
| Types/Interfaces | PascalCase | `User`, `AgentProfile` |
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utils/hooks) | camelCase | `useAuth.ts`, `formatDate.ts` |
| Zustand stores | camelCase with `use` prefix | `useAuthStore`, `useChatStore` |

### Component Structure

```typescript
// Props interface first
interface AgentCardProps {
  agent: Agent;
  onPress?: (id: string) => void;
}

// Functional component with explicit return type
export function AgentCard({ agent, onPress }: AgentCardProps): JSX.Element {
  return (
    <TouchableOpacity onPress={() => onPress?.(agent.uid)}>
      {/* Component JSX */}
    </TouchableOpacity>
  );
}
```

### Error Handling

```typescript
// Always type error as unknown, then narrow
try {
  await fetchData();
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('[Feature] Error:', message);
  // Handle error appropriately
}
```

### Firebase Modular API (Required)

**CRITICAL**: Always use the modular Firebase API, never the namespaced API:

```typescript
// ✅ CORRECT - Modular API
import { db } from '@/src/services/firebase';
import { collection, doc, getDoc, query, where } from '@react-native-firebase/firestore';

const snap = await getDoc(doc(db, 'users', uid));
const q = query(collection(db, 'users'), where('role', '==', 'agent'));

// ❌ WRONG - Namespaced API (deprecated)
import firestore from '@react-native-firebase/firestore';
await firestore().collection('users').doc(uid).get();
```

### Styling (NativeWind/Tailwind)

```typescript
// Use className for styling, extract long classes to constants
const containerClass = `flex-1 p-4 ${isDark ? 'bg-black' : 'bg-white'}`;

<View className={containerClass}>
  <Text className="text-lg font-bold text-gray-900 dark:text-white">
    Title
  </Text>
</View>
```

### Type Definitions

Place shared types in `src/types/`:

```typescript
// src/types/user.ts
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'agent' | 'admin';
  createdAt: Timestamp;
}
```

### State Management (Zustand)

```typescript
// src/store/featureStore.ts
import { create } from 'zustand';

interface FeatureState {
  data: Data[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useFeatureStore = create<FeatureState>((set) => ({
  data: [],
  loading: false,
  fetchData: async () => {
    set({ loading: true });
    // Fetch logic
    set({ data: result, loading: false });
  },
}));
```

## File Organization

```
app/                    # Expo Router screens
├── (tabs)/             # Tab navigation screens
├── auth/               # Auth flow screens
├── chat/               # Chat screens
└── [route].tsx         # Dynamic routes

src/
├── features/           # Feature modules (colocate logic)
├── services/           # Firebase/external services
├── store/              # Zustand stores
├── hooks/              # Custom React hooks
├── types/              # TypeScript interfaces
└── utils/              # Helper functions

components/             # Reusable UI components
├── ui/                 # Primitive components (Button, Input)
└── [Feature]/          # Feature-specific components
```

## Critical Rules

1. **Always use modular Firebase API** - The codebase was migrated from namespaced API
2. **Run `npm run format` before committing** - Ensures consistent code style
3. **Fix all TypeScript errors** - Strict mode is enabled
4. **No `any` types** - Use proper typing, explicit `any` only for Firebase callback params
5. **Console format**: Use `[Feature] Message` format for logging (e.g., `[Auth] Login successful`)

## Environment

- **Node.js**: 20+ (managed via `.nvmrc`)
- **Package Manager**: npm
- **TypeScript**: Strict mode
- **Firebase**: Use modular API only (`getAuth`, `getFirestore`, etc.)
