# commitx

weekly habit tracker with quotas, not streaks

## what it is

a local-first pwa for tracking weekly habits. no accounts, no backend, no streak pressure.

## principles

- week-based (sunday → saturday)
- quotas over streaks
- offline-first
- private by default
- minimal ui

## tech

- vue 3 + typescript + vite
- dexie (indexeddb wrapper)
- lucide icons
- pwa (progressive web app)

## install as app

### iPhone/iPad (Safari)
1. Open commitx in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right

### Android (Chrome)
1. Open commitx in Chrome
2. Tap the menu (3 dots)
3. Tap "Install app" or "Add to Home Screen"

### Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click "Install"

Once installed, commitx works like a native app:
- ✅ Opens in its own window
- ✅ Works offline
- ✅ Data persists better (protected from cache clearing)
- ✅ Faster loading

## install

```bash
npm install
npm run dev
```

## build

```bash
npm run build
npm run preview
```

## data model

habits table:
- id, name, iconName, color
- targetPerWeek (1-7)
- sortOrder, createdAt, archivedAt

entries table:
- habitId, dateKey (YYYY-MM-DD)
- value: 1
- updatedAt

## architecture

- local indexeddb storage
- reactive vue state via habitStore
- sunday-based week calculations
- derived completion state (not stored)

## export

menu → export data → json file

## license

mit
