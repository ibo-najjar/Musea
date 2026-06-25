---
name: pulsar-haptics
description: >
  Add, choose, and maintain haptic feedback using the Pulsar library (react-native-pulsar) in React Native /
  Expo apps. Use this skill whenever the user mentions haptics, vibration, tactile feedback, "make it feel
  native", "add some buzz", "make buttons feel satisfying", or wants interactions to feel polished. Also use
  when the user asks which haptic to use for a specific UI event (button press, success, error, swipe, etc.).
  Covers: installation, all three composer APIs, the full preset catalog with intent notes, a consistency
  pattern (central Haptics module), performance preloading, and design principles from Software Mansion.
---

# Pulsar Haptics

Pulsar (`react-native-pulsar`) is Software Mansion's haptic SDK: 150+ curated patterns, three composer
APIs, and a consistent interface across iOS and Android.  
Docs: https://docs.swmansion.com/pulsar/sdk/react-native/

## Setup

**Requirements:** React Native 0.71+, New Architecture enabled.

```bash
# Expo (recommended — includes config plugin, no native config needed)
npx expo install react-native-pulsar react-native-worklets
npx expo prebuild
```

No Podfile or Gradle changes needed — Pulsar ships as a Turbo Module with a built-in Expo config plugin.

---

## Three APIs

### 1. Presets — play a built-in pattern

```ts
import { Presets } from 'react-native-pulsar';

Presets.success();                        // named preset
Presets.System.impactMedium();            // cross-platform system preset
Presets.System.notificationSuccess();
Presets.Android.effectClick();            // Android-only
```

All preset functions are **worklet-compatible** — call them inside Reanimated worklets or gesture handlers.

### 2. usePatternComposer — custom sequences

```ts
import { usePatternComposer } from 'react-native-pulsar';

const pattern = {
  discretePattern: [
    { time: 0,   amplitude: 1,    frequency: 0.5 },  // sharp hit
    { time: 100, amplitude: 0.5,  frequency: 0.5 },  // echo
    { time: 200, amplitude: 0.25, frequency: 0.3 },  // soft tail
  ],
  continuousPattern: {
    amplitude: [
      { time: 0,   value: 0 },
      { time: 150, value: 0.8 },
      { time: 300, value: 0 },
    ],
    frequency: [
      { time: 0,   value: 0.3 },
      { time: 300, value: 0.6 },
    ],
  },
};

const { play, stop, isParsed } = usePatternComposer(pattern);
// call play() on interaction
```

**Field reference:**
- `time` — milliseconds from pattern start
- `amplitude` — 0–1 intensity
- `frequency` — 0–1 sharpness (0 = soft/thud, 1 = crisp/click)

### 3. useRealtimeComposer — gesture-driven haptics

```ts
import { useRealtimeComposer } from 'react-native-pulsar';
import { Gesture } from 'react-native-gesture-handler';

const { set, playDiscrete, stop, isActive } = useRealtimeComposer();

const pan = Gesture.Pan()
  .onUpdate((e) => {
    const amplitude = Math.min(Math.abs(e.velocityY) / 1000, 1);
    set(amplitude, 0.5);  // live update as user drags
  })
  .onEnd(() => stop());
```

### 4. useAdaptiveHaptics — different patterns per platform

```ts
import { useAdaptiveHaptics, Presets } from 'react-native-pulsar';

const { play } = useAdaptiveHaptics({
  ios: Presets.bloom,
  android: Presets.System.impactLight,
});
play(); // picks the right one automatically
```

---

## Settings & Performance

```ts
import { Settings, HapticSupport } from 'react-native-pulsar';

Settings.enableHaptics(true);            // global on/off
Settings.preloadPresets(['success', 'alarm', 'impactMedium']); // zero-latency play
Settings.getHapticsSupportLevel();       // 0=none 1=limited 2=standard 3=advanced
Settings.stopHaptics();                  // cancel current playback
Settings.shutDownEngine();               // free resources on unmount
```

**Preload vs cache:** Default caching kicks in after first play. Call `preloadPresets()` at screen entry
only for interactions where the first tap must be instant (buttons, game events). Everything else is
fine with default caching.

---

## Jest Setup

```ts
jest.mock('react-native-pulsar', () =>
  require('react-native-pulsar/jest-mock')
);

expect(Presets.System.notificationSuccess).toHaveBeenCalledTimes(1);
```

---

## Preset Catalog — Pick by Intent

Use **System presets** for cross-platform safety. Use **named presets** for richer character on
supported hardware (most modern iOS; mid-range+ Android).

### System Presets (always safe cross-platform)

| Preset | Best for |
|--------|----------|
| `System.impactLight` | Subtle taps, minor state changes, tooltips appearing |
| `System.impactMedium` | Standard button presses, row selection |
| `System.impactHeavy` | Major actions, destructive confirmations |
| `System.impactRigid` | Snapping into place, toggle locks |
| `System.impactSoft` | Gentle arrivals, modals/sheets opening |
| `System.notificationSuccess` | Form submitted, payment complete, task done |
| `System.notificationWarning` | Caution state, soft / recoverable errors |
| `System.notificationError` | Failed action, permission denied, hard error |
| `System.selection` | Picker scroll tick, segmented control change |

### Named Presets by Emotional Intent

**Confirmation / Success**
| Preset | Character | Use for |
|--------|-----------|---------|
| `bloom` | Gentle expansion | Feature unlocking, positive reveal |
| `chip` | Tiny crisp tap | Small checkmarks, micro-confirmations |
| `chirp` | Light and playful | Item saved, autosave tick |
| `click` | Clean mechanical | Default button confirm |
| `strike` | Sharp single hit | Form submit, send message |
| `success` | Satisfying sequence | Task complete, all-done state |

**Alert / Attention**
| Preset | Character | Use for |
|--------|-----------|---------|
| `alarm` | Urgent, relentless | Critical errors, emergencies only |
| `buzz` | Raw buzzing | Error states that need to stand out |
| `clamor` | Chaotic cluster | Unread notifications badge |
| `jolt` | Sudden strong hit | Unexpected state change |
| `pound` | Heavy repeated | Persistent warning |
| `summon` | Escalating call | Incoming call, push notification |

**Celebration**
| Preset | Character | Use for |
|--------|-----------|---------|
| `applause` | Rolling burst | Achievement unlocked |
| `ascent` | Rising excitement | Level up, streak |
| `fanfare` | Triumphant sequence | Major milestone |
| `flourish` | Expressive finish | Onboarding complete |
| `triumph` | Powerful victory | Best result, top score |
| `trumpet` | Sharp celebratory blast | First purchase, big win |

**Transition / Navigation**
| Preset | Character | Use for |
|--------|-----------|---------|
| `cascade` | Flowing downward | Screen pop or back navigation |
| `dissolve` | Soft fade | Modal dismiss, overlay close |
| `fadeOut` | Graceful exit | Calm dismiss, background task done |
| `waterfall` | Long flowing | Page reload, pull-to-refresh complete |
| `zipper` | Snappy unfold | Bottom sheet opening, expand |

**Mechanical / Tactile**
| Preset | Character | Use for |
|--------|-----------|---------|
| `engineRev` | Ramp up | Long-press progress, hold-to-confirm |
| `keyboardMechanical` | Clicky key | In-app custom keyboard |
| `typewriter` | Old-school typing | Character-by-character input feedback |
| `woodpecker` | Rapid tapping | Loading spinner, processing indicator |

**Natural / Ambient**
| Preset | Character | Use for |
|--------|-----------|---------|
| `breath` / `breathing` | Rhythmic, calm | Meditation, rest mode |
| `heartbeat` | Pulse | Health/fitness feature |
| `rain` | Soft random drops | Ambient background feedback |
| `thunder` | Dramatic single boom | Dangerous / irreversible action warning |

**Playful**
| Preset | Character | Use for |
|--------|-----------|---------|
| `balloonPop` | Light burst | Item deleted, playful dismiss |
| `coinDrop` | Reward feel | Earning points, currency credited |
| `flurry` | Excited burst | Surprise reveal, easter egg |
| `pip` | Tiny blip | Notification dot appearing |
| `surge` | Energy build | Swipe-to-unlock, pull-to-refresh start |

### Android System Presets (Android-only, check support first)

`effectClick` `effectDoubleClick` `effectHeavyClick` `effectTick` `keyboardPress` `keyboardRelease`
`keyboardTap` `longPress` `toggleOn` `toggleOff` `scrollTick` `segmentTick` `gestureStart`
`gestureEnd` `primitiveClick` `primitiveTick` `primitiveThud` `clockTick` `confirm`

---

## Keeping Haptics Consistent

Create one central file instead of calling `Presets.*` directly across components. This lets you
change a pattern in one place and have it propagate everywhere.

```ts
// lib/haptics.ts
import { Presets, Settings } from 'react-native-pulsar';

export const Haptics = {
  // Navigation
  tabPress:          () => Presets.System.impactLight(),
  screenBack:        () => Presets.cascade(),

  // Standard actions
  buttonPress:       () => Presets.System.impactMedium(),
  destructivePress:  () => Presets.System.impactHeavy(),
  longPressComplete: () => Presets.System.impactRigid(),

  // Outcomes
  success:           () => Presets.System.notificationSuccess(),
  error:             () => Presets.System.notificationError(),
  warning:           () => Presets.System.notificationWarning(),

  // Selection
  selectionChange:   () => Presets.System.selection(),
  pickerScroll:      () => Presets.System.impactLight(),

  // Special moments
  payment:           () => Presets.success(),
  achievement:       () => Presets.applause(),
  itemDelete:        () => Presets.balloonPop(),
};

export function initHaptics() {
  Settings.enableHaptics(true);
  // Preload the ones hit immediately on first interaction
  Settings.preloadPresets(['cascade', 'balloonPop', 'success']);
}
```

Call `initHaptics()` once at app startup (e.g. in `_layout.tsx`), then import `Haptics` anywhere.

---

## Design Principles

From Software Mansion's haptic design research:

1. **Intensity = stakes.** Reserve `impactHeavy` / `alarm` for irreversible or critical moments.
   If everything vibrates the same, nothing stands out.

2. **Match haptic to animation frame.** Trigger the haptic at the same moment as the visual
   change — perceptual lag between sight and touch breaks trust.

3. **Silence is compositional.** Short gaps between pulses = urgency. Longer gaps = resolution.
   Don't fill every millisecond.

4. **Rhythm > raw intensity.** A well-timed two-pulse sequence communicates outcome better than
   one strong buzz.

5. **Test on real hardware.** iPhone 15 and mid-range Android motors feel completely different.
   A pattern that's crisp on Pixel can feel muddy on Samsung.

6. **Respect system preferences.** Read `Settings.getHapticsSupportLevel()` and disable gracefully
   on `NO_SUPPORT`. Honor the user's device-level haptic toggle.
