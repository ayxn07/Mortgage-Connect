# 🚀 MortgageConnect.ae - Master Roadmap (Implementation-Ready)

**Current Status:** UI Foundation Complete (~50%)  
**Next Goal:** Firebase Integration & Backend Infrastructure  
**Target:** Full-Featured Mortgage Platform with Admin Panel

---

## 📊 Progress Overview

### ✅ Phase 0: Project Structure & Foundation (COMPLETED)

#### Project Setup

- [x] Expo Router with TypeScript configured
- [x] NativeWind (Tailwind CSS) styling system
- [x] React Native Reanimated for animations
- [x] Custom tab navigation with CustomTabBar
- [x] Theme system (Light/Dark mode) with ThemeProvider
- [x] Android build configuration (`android/` folder exists)
- [x] iOS configuration ready
- [x] Babel & Metro bundler configured
- [x] ESLint & Prettier setup

#### UI Components Library

- [x] **Core Components**
  - CustomTabBar component
  - Icon system (comprehensive icon library)
  - ThemeProvider & ThemeToggle
  - Responsive layouts
  - Animated components (using Reanimated)

#### Navigation Structure

- [x] **Tab Navigation** (`app/(tabs)/`)
  - Home tab (`index.tsx`)
  - Agents/Search tab (`agents.tsx`)
  - Settings tab (`settings.tsx`)
- [x] **Standalone Screens**
  - Agent detail screen (`agent-detail.tsx`)
  - Support screen (`support.tsx`)
  - Root layout (`_layout.tsx`)

#### Core Screens (Static UI - Fully Designed)

- [x] **Home Screen** - Featured agents, quick actions, stats, CTA banner
- [x] **Agents/Search Screen** - Search bar, filters, agent cards with favorites
- [x] **Agent Detail Screen** - Parallax header, profile, services, reviews, CTA
- [x] **Settings Screen** - Profile, notifications, preferences, account actions
- [x] **Support Screen** - Contact buttons, FAQ, feedback form

#### Design System

- [x] Consistent color scheme (light/dark modes)
- [x] Typography system, spacing, layout patterns
- [x] Glassmorphism effects, smooth animations
- [x] Card components, button styles, input fields

#### Missing Structure (TODO - Before Phase 1)

- [ ] Create `src/` folder for better organization
- [ ] Create `src/features/` for feature modules (auth, agents, applications, support)
- [ ] Create `src/services/` for Firebase & API helpers
- [ ] Create `src/hooks/` for custom hooks
- [ ] Create `src/store/` for state management (Zustand/Redux if needed)
- [ ] Create `src/utils/` for validators, formatters, helpers
- [ ] Create `src/types/` for TypeScript interfaces & schemas
- [ ] Create reusable UI components library:
  - Card component (base card with variants)
  - Button component (primary, secondary, outline)
  - Input component (text, email, phone, textarea)
  - Avatar component (with fallback initials)
  - Rating component (star display)
  - Badge component (status, tags)
  - Modal/Sheet component

---

## 🔥 Phase 1: Firebase "Invisible Foundation" (IMMEDIATE - DO THIS FIRST)

> **Objective:** Get Firebase project + Expo Dev Client working. App should launch with Firebase initialized without crashes.

### 1.1 Create Firebase Project

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Create new project: "MortgageConnect"
- [ ] Enable Google Analytics (optional)
- [ ] **Enable Authentication**
  - Email/Password provider
  - Google Sign-In provider (optional)
- [ ] **Create Firestore Database**
  - Start in test mode (we'll add rules later)
  - Choose region (e.g., us-central1 or europe-west1)
- [ ] **Enable Firebase Storage**
  - Start in test mode
  - Choose same region as Firestore

### 1.2 Add Apps to Firebase Project

- [ ] **Add Android App**
  - Package name: `com.ayxn07.MortgageConnect` (from app.json)
  - Download `google-services.json`
  - Place in `android/app/` folder
- [ ] **Add iOS App**
  - Bundle ID: `com.ayxn07.MortgageConnect`
  - Download `GoogleService-Info.plist`
  - Place in `ios/` folder (when iOS build is created)

### 1.3 Install Firebase Dependencies

```bash
# Install React Native Firebase (native modules)
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/storage

# Install Expo Dev Client (REQUIRED for native modules)
npx expo install expo-dev-client
```

### 1.4 Configure Expo for Firebase

- [ ] Update `app.json` to include Firebase config files:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.ayxn07.MortgageConnect"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.ayxn07.MortgageConnect"
    },
    "plugins": ["@react-native-firebase/app", "@react-native-firebase/auth"]
  }
}
```

### 1.5 Build Custom Dev Client

- [ ] **Android:** Run `npx expo run:android`
  - This creates a custom native build with Firebase
  - Takes 5-10 minutes first time
  - App will launch on emulator/device
  - Keep this terminal running
- [ ] **iOS:** Run `npx expo run:ios` (if on Mac with Xcode)
  - Requires Xcode installed
  - Takes 10-15 minutes first time

### 1.6 Create Firebase Service Layer

- [ ] Create folder structure: `src/services/`
- [ ] Create `src/services/firebase.ts`:

```typescript
import { FirebaseApp, initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase config (auto-loaded from google-services.json)
const app = initializeApp();

// Export Firebase services
export { auth, firestore, storage };
export default app;
```

### 1.7 Test Firebase Connection

- [ ] Add test code to verify Firestore connection
- [ ] In `app/index.tsx` or create `app/test-firebase.tsx`:

```typescript
import { useEffect } from 'react';
import { firestore } from '@/services/firebase';

// Inside component
useEffect(() => {
  firestore()
    .collection('test')
    .get()
    .then(() => {
      console.log('✅ Firebase connected successfully!');
    })
    .catch((error) => {
      console.error('❌ Firebase connection error:', error);
    });
}, []);
```

### ✅ Phase 1 Definition of Done

- [ ] App launches on emulator/device using dev client (not Expo Go)
- [ ] Firebase initializes without crashes
- [ ] Console shows "✅ Firebase connected successfully!" message
- [ ] No red errors in terminal or app
- [ ] `src/services/firebase.ts` exports auth, firestore, storage

---

## 🔐 Phase 2: Authentication & User Management (Connect Settings Tab)

> **Objective:** Login state + user profile from Firestore. Settings tab shows real data.

### 2.1 Create Auth Hook & Context

- [ ] Create `src/features/auth/` folder
- [ ] Create `src/features/auth/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firestore } from '@/services/firebase';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    return auth().signInWithEmailAndPassword(email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    // Create user document in Firestore
    await firestore().collection('users').doc(result.user.uid).set({
      email,
      displayName,
      role: 'user',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return result;
  };

  const signOut = () => auth().signOut();

  return { user, loading, signIn, signUp, signOut };
}
```

### 2.2 Create Auth Screens

- [ ] Create `app/auth/` folder
- [ ] Create `app/auth/login.tsx` - Login screen with email/password
- [ ] Create `app/auth/signup.tsx` - Signup screen with name, email, password
- [ ] Create `app/auth/forgot-password.tsx` - Password reset screen
- [ ] Add navigation guard to protect authenticated routes

### 2.3 User Document Schema (Firestore)

```typescript
// Collection: users/{uid}
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: 'user' | 'agent' | 'admin';
  phone?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.4 Connect Settings Tab to Firestore

- [ ] Update `app/(tabs)/settings.tsx`:
  - Fetch user data from `users/{uid}` on mount
  - Display real user name, email, phone
  - Implement "Edit Profile" functionality
  - Update Firestore on profile changes
  - Add profile photo upload to Storage
  - Show loading states

### 2.5 Support Ticket System

- [ ] Create `supportQueries` collection schema:

```typescript
// Collection: supportQueries/{queryId}
interface SupportQuery {
  uid: string;
  category: 'general' | 'technical' | 'billing' | 'feedback';
  subject: string;
  message: string;
  attachments?: string[]; // Storage URLs
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

- [ ] Update `app/support.tsx`:
  - Connect feedback form to Firestore
  - Save submissions to `supportQueries` collection
  - Add file attachment support (optional)
  - Show success message after submission

### ✅ Phase 2 Definition of Done

- [ ] Auth fully working (signup/signin/signout)
- [ ] User document created automatically on signup
- [ ] Settings screen shows real user data from Firestore
- [ ] Profile edit updates Firestore successfully
- [ ] Support form saves to `supportQueries` collection
- [ ] Auth state persists across app restarts

---

## 👥 Phase 3: Agents & Search (Connect Home + Search Tabs)

> **Objective:** Agents + search actually come from Firestore. Replace static data with real queries.

### 3.1 Agent Schema (Firestore)

```typescript
// Collection: users/{uid} where role === 'agent'
interface Agent extends User {
  role: 'agent';
  specialty: string[]; // e.g., ['First-time buyer', 'Refinance', 'Islamic mortgage']
  avgRating: number;
  reviewCount: number;
  totalReviews: number;
  bio: string;
  experience: number; // years
  languages: string[]; // e.g., ['English', 'Arabic']
  availability: boolean;
  hourlyRate: number;
  completedProjects: number;
  responseTime: string; // e.g., '2 hours'
  services: {
    name: string;
    price: number;
    duration: string;
  }[];
  location: string;
  whatsapp?: string;
}
```

### 3.2 Seed Test Agents (Manual)

- [ ] Go to Firebase Console → Firestore
- [ ] Create 3-5 agent documents in `users` collection
- [ ] Set `role: 'agent'` for each
- [ ] Add all required fields (specialty, avgRating, bio, etc.)
- [ ] Upload agent photos to Storage and add URLs to `photoURL`

### 3.3 Connect Home Screen to Firestore

- [ ] Update `app/(tabs)/index.tsx`:
  - Replace static `featuredAgents` array
  - Query Firestore: `users` where `role == 'agent'` limit 3
  - Add real-time listener with `onSnapshot`
  - Display loading state while fetching
  - Handle empty state (no agents)
  - Render rating stars based on `avgRating`

### 3.4 Connect Search/Agents Screen to Firestore

- [ ] Update `app/(tabs)/agents.tsx`:
  - Fetch all agents on mount
  - Implement search functionality:
    - **Basic:** Fetch all agents → filter locally by name/specialty
    - **Advanced:** Use Firestore queries with indexes (Phase 3.5)
  - Implement filters:
    - Filter by specialty
    - Filter by availability
    - Filter by rating (>= 4.5, >= 4.0, etc.)
  - Add pagination or infinite scroll
  - Persist favorites in Firestore or AsyncStorage

### 3.5 Connect Agent Detail Screen

- [ ] Update `app/agent-detail.tsx`:
  - Accept agent ID as route param
  - Fetch agent data from Firestore by ID
  - Display all agent details dynamically
  - Load reviews from `reviews` collection (Phase 3.6)
  - Implement "Book Now" and "Schedule Call" actions

### 3.6 Reviews & Ratings System

- [ ] Create `reviews` collection schema:

```typescript
// Collection: reviews/{reviewId}
interface Review {
  reviewId: string;
  agentId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
}
```

- [ ] Create review submission UI
- [ ] Calculate and update agent's `avgRating` and `reviewCount`
- [ ] Display reviews on agent profile
- [ ] Add review moderation (admin can delete)

### ✅ Phase 3 Definition of Done

- [ ] Home screen shows real agents from Firestore
- [ ] Search screen fetches and filters agents
- [ ] Agent detail screen loads data by ID
- [ ] Rating stars reflect actual `avgRating`
- [ ] Reviews display on agent profile
- [ ] Real-time updates work (new agents appear automatically)

---

## 💰 Phase 4: Mortgage Calculator & Applications (Core Product)

> **Objective:** Calculator + eligibility checker + application submission + document upload.

### 4.1 Mortgage Calculator

- [ ] Create `app/calculator.tsx` screen
- [ ] Implement EMI calculation formula:

```typescript
// Monthly Installment = [P x R x (1+R)^N] / [(1+R)^N-1]
// P = Principal loan amount
// R = Monthly interest rate (annual rate / 12 / 100)
// N = Number of monthly installments (years x 12)

function calculateEMI(principal: number, annualRate: number, years: number) {
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
}
```

- [ ] Add input fields: loan amount, interest rate, tenure
- [ ] Display monthly installment
- [ ] Show amortization schedule (optional)
- [ ] Add comparison tool (compare multiple scenarios)

### 4.2 Eligibility Checker

- [ ] Create eligibility logic:

```typescript
function checkEligibility(salary: number, liabilities: number) {
  const ratio = liabilities / salary;
  const eligible = ratio < 0.5; // Liabilities must be < 50% of salary

  return {
    eligible,
    ratio: ratio * 100,
    message: eligible
      ? 'You are eligible for a mortgage!'
      : 'Your liabilities are too high. Reduce debt to qualify.',
    maxLoanAmount: eligible ? salary * 60 : 0, // Example: 60x monthly salary
  };
}
```

- [ ] Build eligibility form UI
- [ ] Display eligibility result with suggestions
- [ ] Show recommended loan amount based on income

### 4.3 Mortgage Application Form (Multi-Step)

- [ ] Create `app/application/` folder
- [ ] Create multi-step form with 4 steps:

**Step 1: Personal Details**

- [ ] Auto-fill from user document (name, email, phone)
- [ ] Allow editing
- [ ] Fields: Full name, email, phone, date of birth, nationality

**Step 2: Employment & Income Details**

- [ ] Fields: Employer name, job title, monthly salary, employment type
- [ ] Fields: Other income sources, total liabilities

**Step 3: Property Details**

- [ ] Fields: Property price, property type (villa/apartment/townhouse)
- [ ] Fields: Property location, ready/off-plan, down payment amount

**Step 4: Document Upload**

- [ ] Install `expo-document-picker`:

```bash
npx expo install expo-document-picker
```

- [ ] Upload documents to Firebase Storage:
  - ID proof (Emirates ID/Passport)
  - Income proof (Salary certificate/Bank statements)
  - Address proof
- [ ] Storage path: `applications/{uid}/{applicationId}/{filename}`
- [ ] Save document URLs to Firestore

**Step 5: Review & Submit**

- [ ] Show summary of all entered data
- [ ] Submit button creates document in `applications` collection
- [ ] Show confirmation screen with application ID
- [ ] Navigate to application status tracker

### 4.4 Application Schema (Firestore)

```typescript
// Collection: applications/{applicationId}
interface Application {
  applicationId: string;
  userId: string;
  agentId?: string | null; // Assigned agent
  status: 'pending' | 'under_review' | 'approved' | 'rejected';

  // Personal Details
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationality: string;
  };

  // Employment Details
  employmentDetails: {
    employerName: string;
    jobTitle: string;
    monthlySalary: number;
    employmentType: 'permanent' | 'contract' | 'self-employed';
    otherIncome: number;
    totalLiabilities: number;
  };

  // Property Details
  propertyDetails: {
    propertyPrice: number;
    propertyType: 'villa' | 'apartment' | 'townhouse';
    location: string;
    readyOrOffPlan: 'ready' | 'off-plan';
    downPayment: number;
  };

  // Documents
  documents: {
    idProof: string; // Storage URL
    incomeProof: string;
    addressProof: string;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  adminNotes?: string;
}
```

### 4.5 Application Status Tracker

- [ ] Create `app/application-status.tsx` screen
- [ ] Fetch user's applications from Firestore
- [ ] Display status with visual indicators:
  - Pending (yellow)
  - Under Review (blue)
  - Approved (green)
  - Rejected (red)
- [ ] Show timeline of status changes
- [ ] Allow viewing application details
- [ ] Show assigned agent (if any)

### ✅ Phase 4 Definition of Done

- [ ] Calculator works and displays correct EMI
- [ ] Eligibility checker validates salary vs liabilities
- [ ] Multi-step application form collects all data
- [ ] Documents upload to Storage successfully
- [ ] Application creates Firestore entry with all data
- [ ] Status tracker displays user's applications
- [ ] Document URLs are saved and accessible

---

## 🎛️ Phase 5: Admin Panel (Next.js Web App)

> **Objective:** Internal dashboard for managing users, agents, and applications.

### 5.1 Project Setup

- [ ] Create new Next.js project in `/admin` folder:

```bash
npx create-next-app@latest admin --typescript --tailwind --app
cd admin
```

- [ ] Install dependencies:

```bash
npm install firebase firebase-admin
npm install @shadcn/ui
npx shadcn-ui@latest init
```

- [ ] Install Shadcn UI components:

```bash
npx shadcn-ui@latest add button table card dialog input
```

### 5.2 Firebase Admin SDK Setup

- [ ] Download service account key from Firebase Console
- [ ] Create `.env.local` in admin folder:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

- [ ] Initialize Firebase Admin in `lib/firebase-admin.ts`

### 5.3 Admin Authentication

- [ ] Create admin login page (`app/login/page.tsx`)
- [ ] Implement Firebase Auth login
- [ ] Check admin role via:
  - **Option 1:** Custom claims (recommended)
  - **Option 2:** Firestore `users/{uid}.role === 'admin'`
- [ ] Add route protection middleware
- [ ] Create admin layout with sidebar navigation

### 5.4 Dashboard - Users Management

- [ ] Create `app/dashboard/users/page.tsx`
- [ ] Display all users in table:
  - Columns: Name, Email, Role, Created Date, Actions
- [ ] Add filters:
  - Filter by role (user/agent/admin)
  - Search by name/email
- [ ] Implement actions:
  - View user details
  - Promote user to agent
  - Suspend/activate account
  - Delete user (with confirmation)

### 5.5 Dashboard - Agent Management

- [ ] Create `app/dashboard/agents/page.tsx`
- [ ] Display all agents in table
- [ ] Show agent performance metrics:
  - Total bookings
  - Average rating
  - Response time
  - Revenue generated
- [ ] Implement actions:
  - Approve/reject agent applications
  - Edit agent profiles
  - Manage agent availability
  - View agent reviews

### 5.6 Dashboard - Applications Management

- [ ] Create `app/dashboard/applications/page.tsx`
- [ ] Display all mortgage applications in table:
  - Columns: Application ID, User, Status, Property Price, Date, Actions
- [ ] Add filters:
  - Filter by status (pending/under_review/approved/rejected)
  - Filter by date range
  - Search by user name or application ID
- [ ] Implement actions:
  - View full application details
  - View uploaded documents securely
  - Update application status
  - Add admin notes
  - Assign to agent
  - Download application as PDF

### 5.7 Dashboard - Support Tickets

- [ ] Create `app/dashboard/support/page.tsx`
- [ ] Display all support queries in table
- [ ] Filter by status (open/in_progress/resolved/closed)
- [ ] Implement actions:
  - View ticket details
  - Update status
  - Add admin response
  - Close ticket

### 5.8 Dashboard - Analytics

- [ ] Create `app/dashboard/analytics/page.tsx`
- [ ] Display key metrics:
  - Total users/agents/applications
  - Application status breakdown (pie chart)
  - User growth over time (line chart)
  - Revenue metrics
  - Top-rated agents
  - Most active users
- [ ] Add date range selector
- [ ] Export data to CSV

### ✅ Phase 5 Definition of Done

- [ ] Admin panel deployed and accessible
- [ ] Admin login with role verification works
- [ ] Users table displays all users with actions
- [ ] Promote to agent functionality works
- [ ] Applications table shows all applications
- [ ] Status update triggers notification to user
- [ ] Documents can be viewed securely
- [ ] Support tickets can be managed
- [ ] Analytics dashboard displays metrics

---

## 🔒 Phase 6: Security & Production Rules

> **Objective:** Implement tight security rules, notifications, and production polish.

### 6.1 Firestore Security Rules

- [ ] Deploy comprehensive security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return request.auth.uid == uid;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isAgent() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agent';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Applications collection
    match /applications/{applicationId} {
      allow read: if isOwner(resource.data.userId) ||
                     isAdmin() ||
                     (isAgent() && resource.data.agentId == request.auth.uid);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAdmin() ||
                       (isAgent() && resource.data.agentId == request.auth.uid);
      allow delete: if isAdmin();
    }

    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true; // Public
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // Support queries
    match /supportQueries/{queryId} {
      allow read: if isOwner(resource.data.uid) || isAdmin();
      allow create: if isAuthenticated() && isOwner(request.resource.data.uid);
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

### 6.2 Firebase Storage Security Rules

- [ ] Deploy storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // User profile photos
    match /users/{userId}/profile/{fileName} {
      allow read: if true; // Public
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Application documents
    match /applications/{userId}/{applicationId}/{document} {
      allow read: if request.auth != null &&
                     (request.auth.uid == userId ||
                      isAdmin() ||
                      isAssignedAgent(applicationId));
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Helper function
    function isAdmin() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isAssignedAgent(appId) {
      let app = firestore.get(/databases/(default)/documents/applications/$(appId));
      return app.data.agentId == request.auth.uid;
    }
  }
}
```

### 6.3 Push Notifications (Firebase Cloud Messaging)

- [ ] Install FCM dependencies:

```bash
npm install @react-native-firebase/messaging
npx expo install expo-notifications
```

- [ ] Request notification permissions
- [ ] Store FCM tokens in Firestore (`users/{uid}.fcmToken`)
- [ ] Create Cloud Function to send notifications:

```typescript
// functions/src/index.ts
export const onApplicationStatusChange = functions.firestore
  .document('applications/{applicationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== after.status) {
      const user = await admin.firestore().collection('users').doc(after.userId).get();

      const fcmToken = user.data()?.fcmToken;

      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Application Status Updated',
            body: `Your application is now ${after.status}`,
          },
          data: {
            applicationId: context.params.applicationId,
            status: after.status,
          },
        });
      }
    }
  });
```

### 6.4 Notification Triggers

- [ ] **Application Status Change:** Notify user when admin updates status
- [ ] **New Message from Agent:** Notify user of new chat message
- [ ] **Document Upload Request:** Notify user to upload missing documents
- [ ] **Review Received:** Notify agent when they receive a review
- [ ] **Appointment Reminder:** Notify user 24h before scheduled call

### 6.5 Additional Security Measures

- [ ] Implement rate limiting for API calls
- [ ] Add input validation and sanitization
- [ ] Implement CAPTCHA for forms (optional)
- [ ] Add two-factor authentication (optional)
- [ ] Implement session management
- [ ] Add audit logs for admin actions
- [ ] Encrypt sensitive data in Firestore

### 6.6 Production Polish

- [ ] **Splash Screen**
  - Design custom splash screen
  - Update `assets/splash.png`
  - Configure in `app.json`
- [ ] **App Icon**
  - Design app icon (1024x1024)
  - Update `assets/icon.png`
  - Generate adaptive icons for Android
- [ ] **Loading States**
  - Add skeleton screens for all data fetching
  - Implement shimmer effects
  - Add loading spinners
- [ ] **Empty States**
  - Design empty state illustrations
  - Add helpful messages
  - Add CTA buttons
- [ ] **Error States**
  - Implement error boundaries
  - Add retry mechanisms
  - Show user-friendly error messages
- [ ] **Offline Handling**
  - Detect offline state
  - Show offline banner
  - Queue actions for when online
  - Cache data with AsyncStorage

### ✅ Phase 6 Definition of Done

- [ ] Firestore security rules deployed and tested
- [ ] Storage security rules deployed and tested
- [ ] Push notifications working for status updates
- [ ] Rate limiting implemented
- [ ] Splash screen and app icon updated
- [ ] All loading/empty/error states implemented
- [ ] Offline handling works
- [ ] App feels production-ready

---

## 🔔 Phase 7: Real-time Features & Messaging (Optional but Recommended)

> **Objective:** Add in-app messaging and real-time updates for better user experience.

### 7.1 In-App Messaging System

- [ ] Create `chats` collection schema:

```typescript
// Collection: chats/{chatId}
interface Chat {
  chatId: string;
  participants: string[]; // [userId, agentId]
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: {
    [userId: string]: number;
  };
}

// Subcollection: chats/{chatId}/messages/{messageId}
interface Message {
  messageId: string;
  senderId: string;
  text: string;
  attachments?: string[]; // Storage URLs
  timestamp: Timestamp;
  read: boolean;
}
```

- [ ] Create `app/chat/[chatId].tsx` screen
- [ ] Build chat UI with message bubbles
- [ ] Implement real-time messaging with Firestore listeners
- [ ] Add file sharing in chat
- [ ] Add typing indicators
- [ ] Add read receipts
- [ ] Show unread message count in tab bar

### 7.2 Real-time Updates

- [ ] Use Firestore `onSnapshot` for real-time data:
  - Agent availability status
  - Application status changes
  - New reviews
  - Unread message count
- [ ] Add optimistic UI updates
- [ ] Implement proper cleanup of listeners

### 7.3 Notifications Badge

- [ ] Show badge count on Settings tab for unread notifications
- [ ] Create notifications screen to view all notifications
- [ ] Mark notifications as read

### ✅ Phase 7 Definition of Done

- [ ] In-app messaging works between users and agents
- [ ] Real-time updates reflect immediately
- [ ] Typing indicators and read receipts work
- [ ] Unread count displays correctly
- [ ] File sharing in chat works

---

## ⚡ Phase 8: Performance & Optimization

> **Objective:** Optimize app performance, reduce bundle size, improve load times.

### 8.1 Performance Optimization

- [ ] **Image Optimization**
  - Implement lazy loading for images
  - Use `expo-image` for better caching
  - Compress images before upload
  - Use appropriate image sizes
- [ ] **List Optimization**
  - Use `FlatList` with `getItemLayout` for fixed-height items
  - Implement `windowSize` and `maxToRenderPerBatch`
  - Add pagination for long lists
  - Implement infinite scroll
- [ ] **Query Optimization**
  - Add Firestore indexes for complex queries
  - Implement query result caching
  - Use `limit()` on queries
  - Batch reads where possible
- [ ] **Bundle Size**
  - Analyze bundle with `npx expo-bundle-visualizer`
  - Remove unused dependencies
  - Implement code splitting
  - Use dynamic imports for heavy screens

### 8.2 Caching Strategy

- [ ] Implement AsyncStorage caching for:
  - User profile data
  - Featured agents
  - Recent searches
- [ ] Set cache expiration times
- [ ] Implement cache invalidation on data changes

### 8.3 Accessibility

- [ ] Add screen reader support (`accessibilityLabel`)
- [ ] Implement proper focus management
- [ ] Add keyboard navigation support
- [ ] Ensure color contrast ratios meet WCAG standards
- [ ] Add alt text for all images
- [ ] Test with TalkBack (Android) and VoiceOver (iOS)

### 8.4 Testing

- [ ] **Unit Tests**
  - Test utility functions (EMI calculator, eligibility checker)
  - Test custom hooks (useAuth)
  - Test form validation
- [ ] **Integration Tests**
  - Test auth flow (signup → login → logout)
  - Test application submission flow
  - Test document upload
- [ ] **E2E Tests** (optional)
  - Use Detox or Maestro
  - Test critical user journeys
- [ ] **Device Testing**
  - Test on multiple Android devices
  - Test on multiple iOS devices
  - Test on different screen sizes
  - Test on slow networks

### ✅ Phase 8 Definition of Done

- [ ] App loads in < 3 seconds
- [ ] Lists scroll smoothly (60 FPS)
- [ ] Images load progressively
- [ ] Bundle size optimized
- [ ] Accessibility score > 90%
- [ ] Critical paths have test coverage
- [ ] App tested on 5+ devices

---

## 🚀 Phase 9: Deployment & Launch

> **Objective:** Deploy to app stores and launch admin panel.

### 9.1 App Store Preparation

- [ ] **App Store Assets**
  - App icon (1024x1024)
  - Screenshots (5-8 per platform)
  - Feature graphic (Android)
  - Promotional video (optional)
- [ ] **App Store Listing**
  - App name: "MortgageConnect.ae"
  - Short description (80 chars)
  - Full description (4000 chars)
  - Keywords for ASO
  - Category: Finance
  - Age rating: 4+
- [ ] **Legal Documents**
  - Privacy policy (required)
  - Terms of service
  - Data deletion instructions
  - Contact information

### 9.2 Build Production Apps

- [ ] **Android (Google Play)**
  - Create signing key: `keytool -genkey -v -keystore my-release-key.keystore`
  - Configure `android/app/build.gradle` with signing config
  - Build AAB: `cd android && ./gradlew bundleRelease`
  - Test AAB on device
  - Upload to Google Play Console
  - Fill out store listing
  - Submit for review
- [ ] **iOS (App Store)**
  - Enroll in Apple Developer Program ($99/year)
  - Create App ID in Apple Developer Portal
  - Create provisioning profiles
  - Build IPA: `cd ios && xcodebuild archive`
  - Upload to App Store Connect via Xcode
  - Fill out store listing
  - Submit for review

### 9.3 Deploy Admin Panel

- [ ] **Choose Hosting**
  - Vercel (recommended for Next.js)
  - Netlify
  - Firebase Hosting
- [ ] **Deploy to Vercel**
  - Connect GitHub repo
  - Configure environment variables
  - Deploy: `vercel --prod`
  - Set up custom domain: `admin.mortgageconnect.ae`
- [ ] **Configure DNS**
  - Add A/CNAME records
  - Enable SSL certificate
  - Test admin panel access

### 9.4 Analytics & Monitoring

- [ ] **Firebase Analytics**
  - Install: `npm install @react-native-firebase/analytics`
  - Track key events:
    - User signup
    - Agent view
    - Application submission
    - Calculator usage
    - Search queries
- [ ] **Crashlytics**
  - Install: `npm install @react-native-firebase/crashlytics`
  - Enable crash reporting
  - Test crash reporting
- [ ] **Performance Monitoring**
  - Install: `npm install @react-native-firebase/perf`
  - Monitor app startup time
  - Monitor screen load times
  - Monitor network requests
- [ ] **Error Tracking** (optional)
  - Setup Sentry
  - Configure error boundaries
  - Monitor error rates

### 9.5 Launch Checklist

- [ ] All features tested and working
- [ ] Security rules deployed
- [ ] Privacy policy and terms published
- [ ] App store listings complete
- [ ] Admin panel deployed and accessible
- [ ] Analytics and monitoring active
- [ ] Support email/phone ready
- [ ] Marketing materials prepared
- [ ] Social media accounts created
- [ ] Press release drafted (optional)

### ✅ Phase 9 Definition of Done

- [ ] Android app live on Google Play Store
- [ ] iOS app live on Apple App Store
- [ ] Admin panel accessible at admin.mortgageconnect.ae
- [ ] Analytics tracking user behavior
- [ ] Crashlytics monitoring crashes
- [ ] Support channels active
- [ ] App is publicly available

---

## 🔮 Phase 10: Future Enhancements & Growth

> **Objective:** Advanced features to scale and improve the platform.

### 10.1 AI-Powered Features

- [ ] **AI Agent Matching**
  - Use ML to match users with best-fit agents
  - Consider: location, specialty, rating, availability
  - Implement recommendation algorithm
- [ ] **Chatbot Support**
  - Integrate AI chatbot for common queries
  - Use OpenAI API or Dialogflow
  - Handle FAQs automatically
- [ ] **Document OCR**
  - Extract data from uploaded documents
  - Auto-fill application fields
  - Reduce manual data entry

### 10.2 Advanced Mortgage Tools

- [ ] **Virtual Property Tours**
  - Integrate 360° property views
  - VR support for immersive tours
- [ ] **Mortgage Comparison Tool**
  - Compare offers from multiple banks
  - Show side-by-side comparison
  - Highlight best deals
- [ ] **Credit Score Checker**
  - Integrate with credit bureaus
  - Show credit score in app
  - Provide improvement tips
- [ ] **Property Valuation Tool**
  - Estimate property value
  - Use market data and ML
  - Show price trends
- [ ] **Investment Calculator**
  - Calculate ROI for investment properties
  - Show rental yield
  - Compare investment scenarios

### 10.3 Localization & Expansion

- [ ] **Arabic Language Support**
  - Translate all UI text
  - RTL layout support
  - Arabic number formatting
- [ ] **Multi-Currency Support**
  - Support AED, USD, EUR
  - Real-time exchange rates
  - Currency conversion
- [ ] **Region-Specific Content**
  - Dubai-specific mortgage rules
  - Abu Dhabi regulations
  - Sharjah guidelines
- [ ] **Localized Date/Time**
  - Use local timezone
  - Format dates per locale
  - Support Islamic calendar

### 10.4 Integrations

- [ ] **Payment Gateway**
  - Stripe integration
  - PayPal integration
  - Apple Pay / Google Pay
  - Process booking fees
- [ ] **Calendar Integration**
  - Sync with Google Calendar
  - Sync with Apple Calendar
  - Send calendar invites
- [ ] **Email Service**
  - SendGrid integration
  - Automated email notifications
  - Email templates
- [ ] **SMS Service**
  - Twilio integration
  - SMS notifications
  - OTP verification
- [ ] **CRM Integration**
  - Salesforce integration
  - HubSpot integration
  - Sync customer data
- [ ] **Property Listing APIs**
  - Integrate with Bayut API
  - Integrate with Property Finder
  - Show live property listings

### 10.5 Gamification & Engagement

- [ ] **Referral Program**
  - Refer friends for rewards
  - Track referral codes
  - Reward both referrer and referee
- [ ] **Loyalty Rewards**
  - Points for app usage
  - Redeem points for discounts
  - Tier-based benefits
- [ ] **Achievements & Badges**
  - First application submitted
  - First agent booked
  - Profile completed
  - Display badges on profile

### 10.6 Advanced Analytics

- [ ] **User Behavior Analytics**
  - Heatmaps of user interactions
  - Funnel analysis
  - Cohort analysis
  - Retention metrics
- [ ] **A/B Testing**
  - Test different UI variations
  - Test different CTAs
  - Measure conversion rates
- [ ] **Business Intelligence**
  - Revenue dashboards
  - Agent performance reports
  - Application conversion rates
  - Customer lifetime value

### 10.7 Platform Expansion

- [ ] **Web App** (React/Next.js)
  - Full-featured web version
  - Responsive design
  - Share codebase with mobile
- [ ] **Agent Mobile App**
  - Dedicated app for agents
  - Manage bookings
  - Chat with clients
  - View earnings
- [ ] **WhatsApp Integration**
  - WhatsApp Business API
  - Chat via WhatsApp
  - Send notifications via WhatsApp

---

## 📝 Implementation Best Practices

### 🎯 Development Priorities

1. **Security First:** Always implement security rules before deploying
2. **User Experience:** Focus on smooth animations and fast load times
3. **Error Handling:** Gracefully handle all error states
4. **Offline Support:** Implement offline-first where possible
5. **Testing:** Test on real devices, not just emulators

### 🛠️ Tech Stack Summary

- **Mobile:** React Native + Expo Router
- **Styling:** NativeWind (Tailwind CSS)
- **Navigation:** Expo Router (file-based)
- **Backend:** Firebase (Auth, Firestore, Storage, FCM)
- **Admin Panel:** Next.js + Tailwind + Shadcn UI
- **State Management:** React Context + Custom Hooks
- **Animations:** React Native Reanimated
- **Forms:** React Hook Form (optional)
- **Validation:** Zod (optional)

### 📚 Recommended Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Firebase](https://rnfirebase.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [NativeWind](https://www.nativewind.dev)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

### 🚦 Practical Build Order (No Confusion)

**Week 1-2: Foundation**

1. Phase 1: Firebase setup + Dev Client
2. Phase 0: Restructure folders (src/)

**Week 3-4: Authentication** 3. Phase 2: Auth + Settings integration

**Week 5-6: Core Features** 4. Phase 3: Agents + Search from Firestore 5. Phase 4: Calculator + Applications

**Week 7-8: Admin & Security** 6. Phase 5: Admin Panel (Next.js) 7. Phase 6: Security Rules + Notifications

**Week 9-10: Polish & Launch** 8. Phase 8: Performance + Testing 9. Phase 9: Deployment

**Post-Launch:** 10. Phase 7: Messaging (optional) 11. Phase 10: Future enhancements

---

## 🎉 Success Metrics (KPIs)

### Key Performance Indicators

- [ ] **User Acquisition**
  - User registration rate > 100/month
  - Agent onboarding rate > 10/month
  - App store rating > 4.5 stars
- [ ] **Engagement**
  - Daily active users (DAU) > 500
  - Average session duration > 5 minutes
  - User retention (30-day) > 40%
- [ ] **Conversion**
  - Application submission rate > 20%
  - Application approval rate > 60%
  - Agent booking rate > 15%
- [ ] **Technical**
  - Crash-free rate > 99.5%
  - App startup time < 3 seconds
  - API response time < 500ms
- [ ] **Business**
  - Monthly recurring revenue (MRR)
  - Customer acquisition cost (CAC)
  - Customer lifetime value (LTV)
  - LTV:CAC ratio > 3:1

---

## 📞 Support & Maintenance

### Ongoing Tasks

- [ ] Monitor Firebase usage and costs
- [ ] Review and respond to app store reviews
- [ ] Update dependencies monthly
- [ ] Fix bugs reported by users
- [ ] Add new features based on feedback
- [ ] Optimize performance based on analytics
- [ ] Update content and agent profiles
- [ ] Backup Firestore data weekly

---

**Last Updated:** February 10, 2026  
**Version:** 2.0 (Implementation-Ready)  
**Status:** In Active Development 🚧

**Next Immediate Action:** Start Phase 1 - Create Firebase Project
