# Weather Intelligence (Mobile)

A React Native mobile companion to the Weather Intelligence dashboard. Built with Expo and TypeScript.

## Features

- Current weather with animated backgrounds
- Hourly and 7-day forecast
- Outdoor activity recommendations (cycling, hiking, running, walking, photography, outdoor work, beach, camping)
- Air quality index with pollutant breakdown
- UV index guidance
- City search with OpenWeather geocoding
- Offline cache support
- Pull-to-refresh
- Unit preferences (°C/°F, km/h/mph, hPa/inHg, km/mi)

## Tech Stack

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile framework |
| Expo | Build system and tooling |
| TypeScript | Type safety |
| Expo Router | File-based navigation |
| Zustand | Client state management |
| TanStack Query | Data fetching and caching |
| date-fns | Date formatting |
| Ionicons | Icon library |

## Getting Started

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

3. Add your OpenWeather API key:

```env
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here
```

4. Build and install a development build. The project uses `expo-dev-client`,
   so Expo Go will not work — native modules are compiled into the build.

```bash
npm run android    # builds and installs on a connected device/emulator
npm run ios        # requires Xcode
```

   To build in the cloud instead of locally:

```bash
npx eas build --profile development --platform android
```

5. Start the dev server and open the installed app:

```bash
npm run dev
```

## A Note on the API Key

`EXPO_PUBLIC_*` variables are inlined into the JavaScript bundle at build time.
Anyone can extract the key from a shipped APK or IPA, so treat it as public:
use a free-tier key, keep it separate from the web app's key, and rotate it if
it starts getting abused. For a production release, proxy the requests through
a backend that holds the key server-side instead.

## Project Structure

```
app/                    # Expo Router screens
  _layout.tsx           # Root tab layout
  index.tsx             # Home screen
  forecast.tsx          # Forecast screen
  activities.tsx        # Activity recommendations
  air-quality.tsx       # Air quality details
  settings.tsx          # App settings
components/
  common/               # Reusable UI components
  search/               # City search modal
  weather/              # Weather-specific components
services/
  weatherApi.ts         # OpenWeather API client
  storage.ts            # AsyncStorage wrapper
store/
  weatherStore.ts       # Zustand state management
types/
  weather.ts            # TypeScript type definitions
utils/
  weatherFormatters.ts  # Weather code mappings and formatters
  unitConversion.ts     # Unit conversion utilities
  activityScore.ts      # Outdoor activity scoring engine
constants/
  theme.ts              # Design system tokens
hooks/
  useWeather.ts         # TanStack Query hooks
tests/
  *.test.ts            # Unit tests
```

## Shared Logic with Web App

Business logic is shared between the web and mobile applications:

- Weather condition descriptions and icon mapping
- Unit conversion formulas
- Activity scoring algorithm
- Weather data transformation

UI is platform-specific: the web uses Next.js with CSS, while mobile uses React Native with StyleSheet.

## Running Tests

```bash
npm test
```

## Type Checking

```bash
npm run typecheck
```

## Release Builds

```bash
npx eas build --profile preview --platform android     # APK for side-loading
npx eas build --profile production --platform android  # AAB for Play Store
npx eas build --profile production --platform ios      # IPA for App Store
```

Binaries are not stored in this repository. Builds are downloaded from the EAS
dashboard and attached to GitHub Releases.

## License

MIT
