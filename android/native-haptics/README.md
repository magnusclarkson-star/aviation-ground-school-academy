# Academy native haptics companion (engineering test only)

This small **Android debug companion** opens the official, deployed [Academy Simulator](https://magnusclarkson-star.github.io/aviation-ground-school-academy/flight-sim.html) in an Android WebView. It requests the ordinary Android `VIBRATE` permission, which is the correct native API pathway when a normal website's `navigator.vibrate` does not produce physical vibration. It leaves the existing hosted JavaScript flight simulator, audio, student controls, radio transcripts, and instruments intact.

## Security and behavior

- The WebView only permits main-frame navigation to the exact HTTPS simulator URL. It cannot open arbitrary domains inside the haptics application.
- A `WebViewCompat.addWebMessageListener` communication channel is injected only for the trusted Academy HTTPS origin. Messages are accepted from the **main frame only**, with a second exact-page origin/path check; `addJavascriptInterface` is not used.
- The native side accepts only `cancel` or integer vibration patterns of at most five entries, each up to 180 ms and no more than 500 ms total. It never repeats a waveform, rate-limits requests to at most one every 250 ms, cancels effects when the app is paused, and refuses requests when the app has no focus.
- The haptics bridge is **only** present when the simulator runs inside this installed Android companion; normal Chrome continues to use its regular web vibration API, unchanged.
- The app requires only **INTERNET** to fetch the simulator and **VIBRATE** to request native feedback. It requests no microphone, location, contacts, camera, storage or phone number permissions.
- This is a **debug test APK, not a Play Store or production release**. It is assembled by GitHub Actions and signed with a generated debug key. Never treat it as a trusted signed production package. No installation has been performed on your phone, and an APK build alone does not prove the physical motor works inside this app.

## Build and review

The connected GitHub repository builds the debug APK in [Build Android Native Haptics Test APK](../../.github/workflows/android-native-haptics.yml) using JDK 17, Gradle 8.9, Android API 35 and AndroidX WebKit 1.14.0. The workflow attaches `academy-native-haptics-test-apk` as an artifact for seven days. An owner can review the source, the GitHub Actions logs, and the downloadable debug build **before** deciding whether to install an APK.

To work locally, open `android/native-haptics` in Android Studio with Android SDK 35 and JDK 17, then build `app:assembleDebug`. Do not publish a production release without a separately controlled, persistent release-signing key, code review, system-WebView compatibility testing, and testing on real Android phones.

**Important:** If the handset's actual vibration motor is functioning (as verified by phone calls and notifications), but the browser does not vibrate, native Android vibration is a reasonable next test. Android system settings can still suppress native effects; a successful API request is not proof of physical movement. This educational simulator is not an accredited flight training device.
