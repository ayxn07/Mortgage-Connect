# MortgageConnect - Premium Agent Booking App

A modern, elegant React Native mobile application built with Expo for connecting users with professional agents. Features a sleek dark/light theme, smooth animations, and an intuitive user interface.

## 📱 About the App

MortgageConnect is a premium agent booking platform that allows users to:
- **Discover Professional Agents**: Browse through a curated list of verified professionals
- **Search & Filter**: Find agents by name, skills, location, and specialty
- **View Detailed Profiles**: Access comprehensive agent information including ratings, reviews, and services
- **Manage Settings**: Customize app preferences, notifications, and account settings
- **Get Support**: Access help center, FAQs, and contact support directly

### Key Features

- 🎨 **Beautiful UI/UX**: Modern, clean interface with smooth animations
- 🌓 **Dark/Light Mode**: Seamless theme switching with system preference support
- 📱 **Custom Tab Bar**: Floating tab bar with animated indicator and haptic feedback
- ⚡ **Performance Optimized**: Fast loading with minimal entrance animations
- 🎯 **Intuitive Navigation**: Easy-to-use navigation with Expo Router
- 💫 **Smooth Interactions**: Haptic feedback and fluid animations throughout
- 🔍 **Advanced Search**: Filter agents by category, availability, and location
- ⭐ **Agent Ratings**: View ratings, reviews, and booking statistics
- 📧 **Support System**: Built-in help center with FAQs and contact options

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Icons**: [@expo/vector-icons](https://icons.expo.fyi/) (Feather Icons)
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
- **TypeScript**: Full type safety throughout the app

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo CLI** - Will be installed with dependencies
- **Expo Go App** (for testing on physical device)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MortgageConnect-app
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### 3. Start the Development Server

```bash
npm start
```

Or:
```bash
npx expo start
```

This will start the Expo development server and display a QR code in your terminal.

## 📱 Running the App

### On Physical Device

1. Install **Expo Go** app on your iOS or Android device
2. Scan the QR code displayed in your terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go app
3. The app will load on your device

### On Emulator/Simulator

#### iOS Simulator (Mac only)
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

Make sure you have:
- **Xcode** installed (for iOS)
- **Android Studio** with an emulator configured (for Android)

### On Web (Development)
```bash
npm run web
```

## 📁 Project Structure

```
MortgageConnect-app/
├── app/                          # App screens and navigation
│   ├── (tabs)/                   # Tab-based screens
│   │   ├── index.tsx            # Home screen
│   │   ├── agents.tsx           # Agents listing screen
│   │   ├── settings.tsx         # Settings screen
│   │   └── _layout.tsx          # Tab layout configuration
│   ├── agent-detail.tsx         # Agent detail screen
│   ├── support.tsx              # Support/Help screen
│   ├── index.tsx                # Splash screen
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable components
│   ├── CustomTabBar.tsx         # Custom animated tab bar
│   ├── Icons.tsx                # Icon components
│   ├── ThemeProvider.tsx        # Theme context provider
│   └── ThemeToggle.tsx          # Theme toggle button
├── assets/                       # Images and static assets
├── global.css                    # Global styles
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🎨 App Screens

### 1. **Home Screen**
- Welcome message with user name
- Quick action cards (Find Agents, Near Me, Book Now, Top Rated)
- Featured agents carousel
- Platform statistics
- "Become an Agent" CTA

### 2. **Agents Screen**
- Search bar for finding agents
- Filter by category and availability
- Agent cards with photos, ratings, and details
- Favorite/unfavorite functionality
- Direct navigation to agent profiles

### 3. **Settings Screen**
- User profile section
- Account settings (Personal Info, Payment, Security)
- Notification preferences with toggles
- Language selection
- Help & Support access
- Terms & Privacy
- Logout and account deletion options

### 4. **Agent Detail Screen**
- Full-screen agent photo with parallax effect
- Comprehensive agent information
- Services and pricing
- Contact information
- Client reviews carousel
- Booking actions

### 5. **Support Screen**
- Quick contact options (Call, Email, Chat)
- Expandable FAQ section
- Feedback form
- Theme-aware design

## 🎯 Key Features Explained

### Custom Tab Bar
- Floating design with rounded corners
- Animated white indicator that slides between tabs
- Haptic feedback on tab press
- Smooth color transitions
- Theme-aware styling

### Theme System
- System-wide dark/light mode
- Persistent theme preference
- Smooth transitions between themes
- Haptic feedback on toggle
- Consistent styling across all screens

### Animations
- Minimal entrance animations for fast loading
- Smooth press interactions on all touchable elements
- Animated tab indicator
- Collapsible filter sections
- Parallax effects on detail screens

## 🔧 Configuration

### Customizing Theme Colors

Edit `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      // Add your custom colors here
    }
  }
}
```

### Modifying Tab Bar

Edit `components/CustomTabBar.tsx` to customize:
- Tab bar height, position, and styling
- Indicator animation and appearance
- Icon sizes and colors
- Haptic feedback intensity

## 📦 Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run reset-project` - Reset project to initial state

## 🐛 Troubleshooting

### Common Issues

**Metro bundler not starting:**
```bash
npx expo start -c
```

**Dependencies not installing:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**iOS build issues:**
```bash
cd ios && pod install && cd ..
```

**Cache issues:**
```bash
npx expo start -c
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Expo team for the amazing framework
- NativeWind for Tailwind CSS support
- React Native Reanimated for smooth animations
- Feather Icons for beautiful iconography

## 📞 Support

For support, email support@MortgageConnect.com or join our Slack channel.

---

**Built with ❤️ using React Native and Expo**
