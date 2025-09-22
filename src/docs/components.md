# Daily Quest Vue Components Documentation

## Components Overview

The Daily Quest application uses the following Vue components to create an engaging gamified habit tracking experience.

### HabitTracker.vue

**Core container component** that orchestrates the application's main functionality.

- **Purpose**: Main application container that coordinates all sub-components and handles the core habit tracking functionality.
- **Key Features**:
  - Pull-to-refresh gesture for refreshing habits
  - Modal management for Timer, AddQuest, and Auth components
  - XP animation and habit completion handling
  - Integration with player progression system
  - Event handling for touch gestures
- **Emits**: None (top-level component)
- **Props**: None (top-level component)
- **Dependencies**:
  - Composables: useHabits, useTimer, usePlayer, useNotification
  - Components: GameStatusBar, QuestList, TimerModal, AddQuestModal, PullToRefresh, BottomNavigation, Auth

### GameStatusBar.vue

**Player status and progression visualization component**.

- **Purpose**: Displays player level, XP, and rank information with animated progress indicators.
- **Key Features**:
  - XP bar with percentage-based progress visualization
  - Level and rank display with animations
  - XP gain animations and visual feedback
  - Responsive updates via custom event system
- **Emits**: None
- **Props**: None
- **Dependencies**:
  - Composables: usePlayer, useI18n

### QuestList.vue

**Displays and manages the list of user habits/quests**.

- **Purpose**: Shows the list of habits, enables completion toggling, and removal.
- **Key Features**:
  - Display habits with completion status and streak indicators
  - Swipe gestures for completing or removing habits
  - Touch interaction handling
  - Timer access for each habit
- **Emits**:
  - `toggle`: When a habit's completion status is toggled
  - `remove`: When a habit is removed
  - `timer`: When the timer is requested for a habit
- **Props**:
  - `habits`: Array of Habit objects to display
- **Dependencies**:
  - Composables: useI18n
  - Types: Habit

### TimerModal.vue

**Pomodoro timer functionality for habit-focused work sessions**.

- **Purpose**: Provides a customizable timer for focusing on habits with various modes.
- **Key Features**:
  - Multiple timer modes (pomodoro, short break, long break, custom)
  - Visual progress tracking
  - Swipe-to-dismiss functionality
  - Session tracking for completed pomodoros
  - Accessible time display
- **Emits**:
  - `close`: When modal is closed
  - `start`: When timer is started
  - `pause`: When timer is paused
  - `stop`: When timer is stopped/reset
  - `setMode`: When timer mode is changed
  - `setCustomTime`: When custom time is set
  - Touch events: `touchStart`, `touchMove`, `touchEnd`
- **Props**:
  - `habit`: The habit associated with the timer
  - `isRunning`: Whether timer is currently running
  - `mode`: Current timer mode
  - `formattedTime`: Formatted time string
  - `customMinutes`: Custom time in minutes
  - `swipeOffset`: Current swipe offset for dismiss gesture
  - `completedSessions`: Optional count of completed sessions
  - `pomodoroGoal`: Optional goal for number of sessions
- **Dependencies**:
  - Composables: useI18n
  - Types: Habit, TimerMode

### BottomNavigation.vue

**App navigation bar with primary action buttons**.

- **Purpose**: Provides navigation and quick access to main app features.
- **Key Features**:
  - Modern, animated navigation with active state indication
  - Add habit button with prominent placement
  - Timer and login quick access
  - Haptic feedback for interactions
- **Emits**:
  - `add-habit`: When add button is clicked
  - `show-timer`: When timer button is clicked
  - `show-stats`: When stats button is clicked
  - `show-login`: When login button is clicked
- **Props**: None
- **Dependencies**:
  - Composables: useI18n

### Auth.vue

**Authentication component for user login and registration**.

- **Purpose**: Handles user authentication with email/password and Google sign-in options.
- **Key Features**:
  - Login and registration forms
  - Google authentication integration
  - Form validation
  - Error handling and user feedback
  - New player creation in Firestore
- **Emits**: None (uses Firebase auth directly)
- **Props**: None
- **Dependencies**:
  - Firebase: auth, firestore
  - Composables: useI18n, useNotification, useCurrentUser (VueFire)

### Notification.vue

**Toast notification system for user feedback**.

- **Purpose**: Displays temporary notifications with different status types.
- **Key Features**:
  - Multiple notification types (success, error, info, warning)
  - Animated appearance and dismissal
  - Styled with Solo Leveling-inspired visual elements
  - Responsive design for different screen sizes
- **Emits**: None
- **Props**:
  - `show`: Boolean to control visibility
  - `message`: Notification message text
  - `type`: Optional notification type (success, error, info, warning)
- **Dependencies**: None

### AddQuestModal.vue

**Modal for adding new habits/quests**.

- **Purpose**: Provides a form interface for creating new habits.
- **Key Features**:
  - Simple form with validation
  - Swipe-to-dismiss functionality
  - Responsive design
- **Emits**:
  - `close`: When modal is closed
  - `add`: When a new habit is submitted
  - Touch events: `touchStart`, `touchMove`, `touchEnd`
- **Props**:
  - `swipeOffset`: Current swipe offset for dismiss gesture
- **Dependencies**:
  - Composables: useI18n

### PullToRefresh.vue

**Pull-to-refresh gesture handler for mobile UX**.

- **Purpose**: Provides visual feedback for pull-to-refresh functionality.
- **Key Features**:
  - Animated pull indicator with progress visualization
  - Threshold-based activation
  - Loading state indication
- **Emits**:
  - `refresh`: When pull exceeds threshold and is released
- **Props**:
  - `isRefreshing`: Whether refresh is in progress
  - `pullOffset`: Current pull distance
  - `threshold`: Threshold distance to trigger refresh
- **Dependencies**:
  - Composables: useI18n

### BackgroundAnimation.vue

**Three.js-powered background particle animation**.

- **Purpose**: Creates an immersive background effect with animated particles.
- **Key Features**:
  - WebGL-based particle system
  - Responsive to window size changes
  - Subtle animated wave patterns
  - Optimized for performance
- **Emits**: None
- **Props**: None
- **Dependencies**:
  - Three.js for WebGL rendering

### LevelUpAnimation.vue

**Level-up celebration animation**.

- **Purpose**: Displays a celebratory animation when the player levels up.
- **Key Features**:
  - Full-screen overlay animation
  - Pulsing effect for visual impact
  - Automatic fade in/out
- **Emits**: None
- **Props**:
  - `show`: Boolean to control visibility
- **Dependencies**: None

### Robby3D.vue

**3D robot mascot component with vibrant color customization**.

- **Purpose**: Displays an interactive 3D robot mascot with customizable colors and animations.
- **Key Features**:
  - Three.js-powered 3D rendering with GLB model support
  - Multiple color schemes (default, vibrant, neon, pastel)
  - Enhanced lighting system for vibrant colors
  - Material enhancement for more vivid appearance
  - Multiple animation variants (celebrating, encouraging, sleeping)
  - Responsive sizing options
  - Speech bubble system with contextual messages
  - Fallback placeholder robot if model fails to load
- **Emits**: None
- **Props**:
  - `size`: Robot size ('sm', 'md', 'lg', 'xl') - defaults to 'md'
  - `variant`: Animation variant ('default', 'celebrating', 'encouraging', 'sleeping') - defaults to 'default'
  - `animated`: Whether animations are enabled - defaults to true
  - `colorScheme`: Color scheme ('default', 'vibrant', 'neon', 'pastel') - defaults to 'vibrant'
- **Dependencies**:
  - Three.js for 3D rendering
  - GLTFLoader for model loading
- **Usage Examples**:

  ```vue
  <!-- Basic usage with vibrant colors -->
  <Robby3D variant="encouraging" color-scheme="vibrant" />

  <!-- Neon theme for celebrations -->
  <Robby3D variant="celebrating" color-scheme="neon" size="lg" />

  <!-- Pastel theme for sleeping state -->
  <Robby3D variant="sleeping" color-scheme="pastel" animated="false" />
  ```

## Component Relationships

The components in Daily Quest are structured in a hierarchical manner:

1. **HabitTracker** serves as the main container component
2. Inside HabitTracker, these components are rendered:
   - **GameStatusBar** (always visible)
   - **QuestList** (always visible)
   - **BottomNavigation** (always visible)
   - **PullToRefresh** (always visible)
   - **TimerModal** (conditionally visible)
   - **AddQuestModal** (conditionally visible)
   - **Auth** (conditionally visible in a modal container)

3. Notifications are managed through the **Notification** component
4. Visual effects are provided by **BackgroundAnimation** and **LevelUpAnimation**

## Component Communication

The components communicate through:

1. **Props passing**: Parent components pass data to children
2. **Event emission**: Child components emit events to notify parents
3. **Shared state via composables**: Components access shared state through Vue composables
4. **Custom global events**: For cross-component communication (e.g., XP updates)

## Styling and Theming

All components follow a consistent visual style with:

- Solo Leveling-inspired visual elements
- Responsive design for mobile and desktop
- Roboto font family
- Consistent color scheme with purple/blue gradient accents
- Animated elements and transitions
- Accessibility considerations for contrasts and readability
