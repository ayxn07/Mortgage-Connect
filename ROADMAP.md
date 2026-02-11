# 🚀 MortgageConnect.ae - Master Roadmap (Implementation-Ready)

**Current Status:** Phase 4 Complete + Bonus Chat Phase Complete (~95%)  
**Next Goal:** Phase 5 - Admin Panel (Next.js Web App)  
**Target:** Full-Featured Mortgage Platform with Admin Panel & Real-Time Chat

---

## 📊 Progress Overview

### ✅ Phase 0: Project Structure & Foundation (COMPLETED ✓)

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
  - CustomTabBar component with animations
  - Icon system (comprehensive icon library)
  - ThemeProvider & ThemeToggle with smooth transitions
  - ThemeTransition component with circular reveal animation
  - DynamicStatusBar component
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
  - Test Firebase screen (`test-firebase.tsx`)
  - Root layout (`_layout.tsx`)

#### Core Screens (Static UI - Fully Designed)

- [x] **Home Screen** - Featured agents, quick actions, stats, CTA banner
- [x] **Agents/Search Screen** - Search bar, filters, agent cards with favorites
- [x] **Agent Detail Screen** - Parallax header, profile, services, reviews, CTA
- [x] **Settings Screen** - Profile, notifications, preferences, account actions, Firebase test button
- [x] **Support Screen** - Contact buttons, FAQ, feedback form

#### Design System

- [x] Consistent color scheme (light/dark modes)
- [x] Typography system, spacing, layout patterns
- [x] Glassmorphism effects, smooth animations
- [x] Card components, button styles, input fields
- [x] Theme toggle with circular reveal animation
- [x] SafeAreaView deprecation warning suppressed

#### Project Structure (COMPLETED ✓)

- [x] Create `src/` folder for better organization
- [x] Create `src/features/` for feature modules (auth, agents, applications, support)
- [x] Create `src/services/` for Firebase & API helpers
- [x] Create `src/hooks/` for custom hooks
- [x] Create `src/store/` for state management (Zustand)
- [x] Create `src/utils/` for validators, formatters, helpers
- [x] Create `src/types/` for TypeScript interfaces & schemas

---

## 🔥 Phase 1: Firebase "Invisible Foundation" (COMPLETED ✓)

> **Objective:** Get Firebase project + Expo Dev Client working. App should launch with Firebase initialized without crashes.

### 1.1 Create Firebase Project

- [x] Go to [Firebase Console](https://console.firebase.google.com/)
- [x] Create new project: "MortgageConnect" (mortgage-connect-5b774)
- [x] Enable Google Analytics (optional)
- [x] **Enable Authentication**
  - Email/Password provider
  - Google Sign-In provider (optional)
- [x] **Create Firestore Database**
  - Start in test mode (we'll add rules later)
  - Choose region (e.g., us-central1 or europe-west1)
- [x] **Enable Firebase Storage**
  - Start in test mode
  - Choose same region as Firestore

### 1.2 Add Apps to Firebase Project

- [x] **Add Android App**
  - Package name: `com.ayxn07.MortgageConnect` (from app.json)
  - Download `google-services.json`
  - Place in root folder (configured in app.json)
- [ ] **Add iOS App**
  - Bundle ID: `com.ayxn07.MortgageConnect`
  - Download `GoogleService-Info.plist`
  - Place in root folder (when iOS build is created)

### 1.3 Install Firebase Dependencies

- [x] Install React Native Firebase (native modules)
  - @react-native-firebase/app
  - @react-native-firebase/auth
  - @react-native-firebase/firestore
  - @react-native-firebase/storage
- [x] Install Expo Dev Client (REQUIRED for native modules)
  - expo-dev-client

### 1.4 Configure Expo for Firebase

- [x] Update `app.json` to include Firebase config files
- [x] Add Firebase plugins to app.json
- [x] Configure Android googleServicesFile path
- [x] Configure iOS googleServicesFile path

### 1.5 Build Custom Dev Client

- [x] **Android:** Custom dev client configured
  - Build configuration ready in android/ folder
  - Google services configured
- [ ] **iOS:** Run `npx expo run:ios` (if on Mac with Xcode)
  - Requires Xcode installed
  - Takes 10-15 minutes first time

### 1.6 Create Firebase Service Layer

- [x] Create folder structure: `src/services/`
- [x] Create `src/services/firebase.ts`
- [x] Export auth, firestore, storage services
- [x] Auto-initialization from google-services.json

### 1.7 Test Firebase Connection

- [x] Create `app/test-firebase.tsx` screen
- [x] Add Firebase connection test with UI
- [x] Add navigation button in Settings screen
- [x] Test screen shows loading, success, or error states
- [x] Animated UI with status indicators

### ✅ Phase 1 Definition of Done

- [x] App launches on emulator/device using dev client (not Expo Go)
- [x] Firebase initializes without crashes
- [x] Test screen available to verify connection
- [x] No red errors in terminal or app
- [x] `src/services/firebase.ts` exports auth, firestore, storage
- [x] Theme system working with dark/light mode toggle
- [x] All TypeScript errors resolved

---

## 🔐 Phase 2: Authentication & User Management (COMPLETED ✓)

> **Objective:** Login state + user profile from Firestore. Settings tab shows real data.

### 2.1 Create Auth Hook & Context

- [x] Create `src/features/auth/` folder
- [x] Create `src/hooks/useAuth.ts` (wraps authStore)
- [x] Create `src/store/authStore.ts` (Zustand store with initialize, signIn, signUp, signOut, resetPassword, updateProfile, refreshUserDoc)

### 2.2 Create Auth Screens

- [x] Create `app/auth/` folder with `_layout.tsx`
- [x] Create `app/auth/login.tsx` - Login screen with email/password
- [x] Create `app/auth/signup.tsx` - Signup screen with name, email, password, password strength
- [x] Create `app/auth/forgot-password.tsx` - Password reset screen with success state
- [x] Add auth-aware routing in `app/index.tsx` (splash → auth check → redirect)
- [x] **Google Sign-In Integration**
  - Google Sign-In button on login screen
  - New user detection after Google auth
  - Registration completion screen for new Google users
  - Automatic Firestore user document creation
  - Seamless integration with existing auth flow

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

- [x] Update `app/(tabs)/settings.tsx`:
  - Fetch user data from authStore (firebaseUser + userDoc)
  - Display real user name, email, initials
  - Connect notification toggles to settingsStore (persisted via AsyncStorage)
  - Implement real logout via authStore.signOut() → redirect to /auth/login
  - Implement delete account (Firestore doc + Firebase Auth user deletion)
  - Show loading states

### 2.5 Support Ticket System

- [x] Create `supportQueries` collection schema in `src/types/support.ts`

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

- [x] Update `app/support.tsx`:
  - Connect feedback form to Firestore via supportStore
  - Save submissions to `supportQueries` collection
  - Pre-fill name/email from authenticated user
  - Show success state after submission with "Send Another" option
  - Show loading spinner during submission

### ✅ Phase 2 Definition of Done

- [x] Auth fully working (signup/signin/signout)
- [x] User document created automatically on signup
- [x] Settings screen shows real user data from Firestore
- [x] Notification toggles persisted via settingsStore (AsyncStorage)
- [x] Support form saves to `supportQueries` collection
- [x] Auth state persists across app restarts
- [x] Home screen greeting shows real user name

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

### 3.2 Seed Test Agents (Programmatic)

- [x] Created `src/services/seedAgents.ts` with programmatic seeding
- [x] 5 realistic mortgage agent profiles with UAE-specific data
- [x] 14 test reviews across all agents
- [x] Auto-seeds on first app load (AsyncStorage flag prevents re-seeding)
- [x] Seeding wired into root `_layout.tsx` (runs after auth initialized)

### 3.3 Connect Home Screen to Firestore

- [x] Update `app/(tabs)/index.tsx`:
  - Replace static `featuredAgents` array with real Firestore data
  - Query Firestore via `useAgentStore.fetchFeaturedAgents()` limit 5
  - Real-time listener with `subscribe()` for auto-updates
  - Display loading skeleton while fetching
  - Handle empty state (no agents available)
  - Rating stars reflect actual `avgRating`
  - Dynamic platform stats (agent count, avg rating, total projects)
  - Navigation passes `agentId` to detail screen

### 3.4 Connect Search/Agents Screen to Firestore

- [x] Update `app/(tabs)/agents.tsx`:
  - Complete redesign with premium card layout
  - Agent avatar + info side-by-side layout with online indicator
  - Fetch all agents on mount via `useAgents()` hook
  - Real-time subscription via `subscribe()`
  - Client-side search filtering (name, location, specialty)
  - Mortgage-relevant categories (First-time Buyer, Refinance, Islamic Mortgage, etc.)
  - Filter by availability (server-side via Firestore)
  - Filter count badge on filter button
  - Persisted favorites via `useFavoritesStore` (AsyncStorage)
  - Animated card entrance with `FadeInDown`
  - Pull-to-refresh functionality
  - Loading skeleton cards
  - Empty state with filter reset option
  - Full dark/light mode theme support
  - Results count indicator

### 3.5 Connect Agent Detail Screen

- [x] Update `app/agent-detail.tsx`:
  - Accept `agentId` as route param via `useLocalSearchParams`
  - Fetch agent data from Firestore by ID via `useAgentStore.fetchAgentById()`
  - Complete redesign with full dark/light mode theme support
  - Parallax header with scroll-based animations
  - Profile card with rating, specialties, and quick stats grid
  - About section with languages
  - Services list with pricing (AED currency)
  - Contact section with tappable email/phone/WhatsApp
  - WhatsApp deep linking
  - Phone call deep linking
  - Email deep linking
  - Availability badge with green theme
  - Scrolling header bar that appears on scroll
  - Fixed bottom CTA (WhatsApp + Call Now)
  - Persisted favorite toggle via `useFavoritesStore`
  - Loading state with activity indicator

### 3.6 Reviews & Ratings System

- [x] Reviews display on agent profile:
  - Horizontal carousel of review cards
  - Each review shows avatar initial, name, time ago, star rating, comment
  - Empty state when no reviews exist
  - Loading state while fetching
- [x] Review submission UI:
  - Star rating input component (tap to rate 1-5)
  - Comment text area
  - Submit button with loading state
  - Validation (rating + comment required)
  - Creates review via `createReview()` service (batched write)
  - Auto-recalculates agent's `avgRating` and `reviewCount`
  - Refreshes reviews list after submission
  - Success alert on completion
- [x] Reviews fetched from `reviews` collection via `fetchAgentReviews()`
- [x] Agent rating auto-updates via `recalculateAgentRating()`

### ✅ Phase 3 Definition of Done

- [x] Home screen shows real agents from Firestore
- [x] Search screen fetches and filters agents
- [x] Agent detail screen loads data by ID
- [x] Rating stars reflect actual `avgRating`
- [x] Reviews display on agent profile
- [x] Real-time updates work (new agents appear automatically)
- [x] Review submission works and updates agent rating
- [x] Dark/light mode works perfectly on all screens
- [x] Favorites persisted via AsyncStorage

---

## 💰 Phase 4: Mortgage Calculator & Applications (Core Product)

> **Objective:** Calculator + eligibility checker + application submission + document upload.

### 4.1 Mortgage Calculator

- [x] Create `app/calculator.tsx` screen
- [x] Implement EMI calculation formula:

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

- [x] Add input fields: loan amount, interest rate, tenure
- [x] Display monthly installment
- [x] Show amortization schedule (optional)
- [x] Add comparison tool (compare multiple scenarios)

### 4.2 Eligibility Checker

- [x] Create eligibility logic:

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

- [x] Build eligibility form UI
- [x] Display eligibility result with suggestions
- [x] Show recommended loan amount based on income

### 4.3 Mortgage Application Form (Multi-Step)

- [x] Create `app/application.tsx` screen
- [x] Create multi-step form with 5 steps:

**Step 1: Personal Details**

- [x] Auto-fill from user document (name, email, phone)
- [x] Allow editing
- [x] Fields: Full name, email, phone, date of birth, nationality

**Step 2: Employment & Income Details**

- [x] Fields: Employer name, job title, monthly salary, employment type
- [x] Fields: Other income sources, total liabilities

**Step 3: Property Details**

- [x] Fields: Property price, property type (villa/apartment/townhouse/penthouse/land)
- [x] Fields: Property location, ready/off-plan, down payment amount

**Step 4: Document Upload**

- [x] Document upload UI with simulated picker (expo-document-picker ready):
  - ID proof (Emirates ID/Passport)
  - Income proof (Salary slips/Bank statements)
  - Property valuation report
- [x] Storage path: `applications/{uid}/{applicationId}/{filename}`
- [x] Save document URLs to Firestore

**Step 5: Review & Submit**

- [x] Show summary of all entered data with edit buttons per section
- [x] Submit button creates document in `applications` collection
- [x] Show confirmation screen with application ID
- [x] Navigate to application status tracker

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

- [x] Create `app/my-applications.tsx` screen
- [x] Fetch user's applications from Firestore
- [x] Display status with visual indicators:
  - Draft (gray)
  - Submitted (blue)
  - Under Review (amber)
  - Approved (green)
  - Rejected (red)
  - Completed (purple)
- [x] Show timeline of status progression
- [x] Filter applications by status
- [x] Pull-to-refresh functionality
- [x] Empty state with apply CTA
- [x] Allow viewing application details
- [x] Show assigned agent (if any)

### ✅ Phase 4 Definition of Done

- [x] Calculator works and displays correct EMI
- [x] Eligibility checker validates salary vs liabilities
- [x] Multi-step application form collects all data
- [x] Documents upload UI ready (Firebase Storage integration prepared)
- [x] Application creates Firestore entry with all data
- [x] Status tracker displays user's applications
- [x] Document URLs are saved and accessible

---

## 💬 BONUS PHASE: Real-Time Chat System (User ↔ Agent ↔ Admin) (COMPLETED ✓)

> **Objective:** Build a production-ready, WhatsApp-style chat system with real-time messaging, media sharing, typing indicators, read receipts, and online status.

### Overview

A comprehensive in-app messaging system that enables seamless communication between users, agents, and admins. The chat system features real-time message delivery, message history persistence, and all the modern chat features users expect.

### B.1 Chat Architecture & Data Model (COMPLETED ✓)

**Firestore Collections Structure:**

```typescript
// Collection: chats/{chatId}
interface Chat {
  chatId: string;
  type: 'user_agent' | 'user_admin' | 'agent_admin';
  participants: {
    [userId: string]: {
      uid: string;
      displayName: string;
      photoURL: string | null;
      role: 'user' | 'agent' | 'admin';
      lastSeen: Timestamp;
      isOnline: boolean;
    };
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'document';
  };
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archived: {
    [userId: string]: boolean;
  };
  muted: {
    [userId: string]: boolean;
  };
}

// Subcollection: chats/{chatId}/messages/{messageId}
interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  type: 'text' | 'image' | 'document' | 'system';
  content: {
    text?: string;
    mediaUrl?: string; // Firebase Storage URL
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string; // For images
  };
  timestamp: Timestamp;
  readBy: {
    [userId: string]: Timestamp;
  };
  deliveredTo: {
    [userId: string]: Timestamp;
  };
  edited: boolean;
  editedAt?: Timestamp;
  deleted: boolean;
  deletedAt?: Timestamp;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
}

// Collection: userPresence/{userId}
interface UserPresence {
  uid: string;
  isOnline: boolean;
  lastSeen: Timestamp;
  currentChatId?: string | null;
  isTypingIn?: string | null; // chatId where user is typing
}
```

### B.2 Chat List Screen (COMPLETED)

- [x] Create `app/(tabs)/chats.tsx` - Main chat list screen (tab-based)
- [x] Features:
  - Display all user's chats sorted by last message time
  - Show unread message count badge per chat
  - Display last message preview (text with "You:" prefix)
  - Show online status indicator (green dot)
  - Show last seen time ("5 min ago", "Yesterday", etc.)
  - Pull-to-refresh to sync chats
  - Search chats by participant name
  - Empty state with "Browse Agents" CTA
  - Real-time updates via Firestore listeners
  - Animated card entrance with FadeInDown
  - Avatar with initials + role badge (agent=blue, admin=amber)
  - Full dark/light mode support

### B.3 Chat Screen (Conversation View) (COMPLETED)

- [x] Create `app/chat/[chatId].tsx` - Individual chat screen
- [x] **UI Components:**
  - **Header:**
    - Participant avatar with online status (green dot)
    - Participant name and role badge
    - Last seen / "Online" / "Typing..." status
    - Back button
  - **Message List:**
    - Inverted FlatList for chat messages
    - Message bubbles (sender on right, receiver on left)
    - Timestamp on each message
    - Read receipts (check icon for sent, blue check-circle for read)
    - Date separators ("Today", "Yesterday", "Jan 15")
    - Reply preview above message with left border
    - Long press menu: Reply, Delete (with haptic feedback)
    - Loading indicator while fetching older messages
    - "Load more" button for pagination
    - Soft delete shows "This message was deleted" italic
  - **Input Bar:**
    - Text input with auto-grow (max 5 lines)
    - Send button (disabled when empty, themed black/white)
    - Typing indicator when other user is typing (3 animated dots)
    - `react-native-keyboard-controller` for smooth keyboard tracking (iMessage-style)
    - KeyboardAvoidingView with interactive dismiss

### B.4 Real-Time Features (COMPLETED)

- [x] **Typing Indicators:**
  - Update `userPresence/{userId}.isTypingIn` when user types
  - Listen to other participant's typing status
  - Show "typing..." in chat header
  - Debounce typing updates
  - Clear typing status after 3 seconds of inactivity
- [x] **Online Status:**
  - Update `userPresence/{userId}.isOnline` on app state change
  - Update `lastSeen` timestamp on status change
  - Show green dot when online
  - Show "Last seen X ago" when offline
- [x] **Read Receipts:**
  - Mark messages as read when chat screen is visible
  - Update `message.readBy[userId]` with timestamp
  - Show blue check-circle when message is read
  - Show grey check when sent
- [x] **Message Delivery:**
  - Show message immediately in UI
  - Firestore write for persistence

### B.5 Media & File Sharing

- [ ] **Image Sharing:**
  - Use `expo-image-picker` to select from gallery or camera
  - Compress images before upload (max 1920px width)
  - Upload to Firebase Storage: `chats/{chatId}/images/{messageId}.jpg`
  - Generate thumbnail (300px) for preview
  - Show upload progress bar
  - Display images in message bubble
  - Tap to open full-screen lightbox
  - Pinch to zoom in lightbox
  - Swipe to navigate between images
- [ ] **Document Sharing:**
  - Use `expo-document-picker` to select files
  - Support PDF, DOC, DOCX, XLS, XLSX (max 10MB)
  - Upload to Firebase Storage: `chats/{chatId}/documents/{messageId}.pdf`
  - Show file name, size, and icon in message
  - Tap to download and open with system viewer
  - Show download progress
- [ ] **Voice Messages (Optional):**
  - Use `expo-av` to record audio
  - Max duration: 2 minutes
  - Upload to Firebase Storage: `chats/{chatId}/audio/{messageId}.m4a`
  - Show waveform visualization
  - Playback controls in message bubble

### B.6 Chat Notifications

- [ ] **Push Notifications:**
  - Send FCM notification when new message arrives
  - Notification title: Sender name
  - Notification body: Message preview
  - Notification data: `{ chatId, senderId, messageId }`
  - Tap notification to open chat screen
  - Group notifications by chat
  - Show unread count in notification badge
- [ ] **In-App Notifications:**
  - Show banner notification when message arrives in background chat
  - Play sound on new message (if not muted)
  - Vibrate on new message
  - Update unread count in tab bar badge
- [ ] **Mute Notifications:**
  - Allow users to mute specific chats
  - Options: 1 hour, 8 hours, 1 week, Forever
  - Store mute status in `chats/{chatId}.muted[userId]`
  - Don't send notifications for muted chats

### B.7 Chat Features & Actions (PARTIALLY COMPLETED)

- [x] **Message Actions:**
  - **Reply:** Quote a message and reply to it
  - **Delete:** Soft delete message for everyone (shows "This message was deleted")
- [ ] **Future Enhancements (Not Yet Implemented):**
  - Copy message text to clipboard
  - Forward message to another chat
  - Edit sent message (within 15 minutes)
  - Add emoji reactions to messages
  - Archive/Mute/Block UI in chat header menu
  - Search messages within chat

### B.9 Chat Security & Moderation

- [ ] **Content Moderation:**
  - Implement profanity filter for messages
  - Auto-flag messages with inappropriate content
  - Allow users to report messages
  - Admin review queue for flagged content
- [ ] **Spam Prevention:**
  - Rate limit messages (max 10 per minute)
  - Detect and block spam patterns
  - Temporary ban for spam violations
- [ ] **Privacy Controls:**
  - Block/unblock users
  - Hide online status (optional)
  - Disable read receipts (optional)
  - Delete account removes all chat data

### B.10 Performance Optimization (COMPLETED)

- [x] **Message Pagination:**
  - Load 30 messages initially
  - Load more on "Load older messages" tap
  - Use Firestore `startAfter` for pagination
  - Cache loaded messages in Zustand store
- [x] **Real-time Listener Optimization:**
  - Use `limit()` on message queries
  - Detach listeners when screen unmounts (module-level unsub tracking)
  - Debounce typing indicator updates (3s timeout)

### B.11 Chat UI/UX Polish (COMPLETED)

- [x] **Animations:**
  - Smooth message bubble entrance (FadeIn, FadeInDown)
  - Typing indicator animation (3 dots with staggered FadeIn)
  - Reply bar slide-in animation (FadeInUp)
  - Pull-to-refresh on chat list
- [x] **Keyboard Handling:**
  - `react-native-keyboard-controller` for smooth iMessage-style keyboard tracking
  - KeyboardAvoidingView with `behavior="padding"`
  - Input bar sits precisely on top of keyboard
  - Interactive keyboard dismiss mode
- [x] **Haptic Feedback:**
  - Haptic feedback on message long press (Medium impact)
  - Haptic feedback on message send (Light impact)
- [x] **Dark Mode:**
  - Full dark mode support across all chat screens
  - Message bubbles adapt to theme (me=white/black, other=card bg)
  - Proper contrast ratios
  - Input bar, header, badges all theme-aware

### B.12 Integration with Existing Features (PARTIALLY COMPLETED)

- [ ] **Agent Detail Screen:**
  - Add "Message Agent" button (not yet wired)
  - Creates new chat or opens existing chat
  - Pre-fill chat with agent context
- [ ] **Application Screen:**
  - Add "Chat with Admin" button for support
  - Link application ID in chat for context
- [x] **Tab Bar & Navigation:**
  - Unread count badge on chats tab in CustomTabBar
  - Chat tab with message-circle icon
  - Chat stack route for conversation navigation

### B.13 Testing & Quality Assurance

- [ ] **Functional Testing:**
  - Test message sending/receiving
  - Test media upload/download
  - Test typing indicators
  - Test read receipts
  - Test online status
  - Test notifications
- [ ] **Performance Testing:**
  - Test with 1000+ messages in chat
  - Test with slow network
  - Test with offline mode
  - Measure memory usage
- [ ] **Edge Cases:**
  - Test with blocked users
  - Test with deleted messages
  - Test with archived chats
  - Test with muted chats
  - Test with multiple devices

### ✅ Bonus Phase Definition of Done

- [x] Chat list screen displays all conversations
- [x] Chat screen shows real-time messages
- [x] Typing indicators work smoothly
- [x] Online status updates in real-time
- [x] Read receipts show correctly
- [ ] Image sharing works with compression
- [ ] Document sharing works with preview
- [ ] Push notifications arrive instantly
- [ ] Message search works accurately
- [ ] Chat actions (archive, mute, delete) work
- [ ] Admin can monitor and moderate chats
- [x] Performance is smooth with pagination (30-message pages)
- [x] Dark mode looks perfect
- [x] All animations are smooth
- [x] Keyboard handling works perfectly (react-native-keyboard-controller)
- [ ] Accessibility features work

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
