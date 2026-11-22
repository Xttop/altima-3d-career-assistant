# ALTIMA for Android and Quest 3

This standalone Android APK opens the ALTIMA test service in a WebView. On
Quest 3, the top button opens the system browser for the immersive WebXR
guide. Open the guide with **Uruchom AR na Quest 3** in Meta Quest Browser.
The APK itself uses a flat window and does not implement native OpenXR.
It also runs as a companion on Android phones. The app needs internet access.

The packaged HTTPS origin is the Render test service. Deploy the latest
test branch and configure its server-side `OPENAI_API_KEY` before testing
AI features. No API key belongs in the APK. The web client calls:

| Endpoint | Contract |
| --- | --- |
| `GET /api/status` | Returns `{"ai":true}` when the server has an AI key. |
| `POST /api/transcribe` | Sends an audio blob as WebM, MP4 or Ogg, with `X-Altima-Language`. Returns `{"text":"…"}`. |
| `POST /api/chat` | Sends JSON with `language`, `mode`, and alternating `messages`. An optional `image` carries a JPEG data URL. Returns `{"reply":"…"}`. |

The supported language values are `pl-PL`, `uk-UA`, and `en-US`. The mode
values are `colleague`, `mentor`, and `manager`. Microphone and camera
permissions are granted only to the configured HTTPS origin and only
after Android grants the requested permission.

## Install and build

On Quest 3, enable Developer Mode for your headset and use SideQuest on
an Android phone with a USB data cable, or use `adb install -r altima-quest-3.apk`
from a computer. Accept the USB debugging prompt in the headset. Open the
sideloaded app from **Unknown Sources**. Installing the APK on the phone
alone installs it on the phone only.

To rebuild, install Android SDK Platform 35 and Build Tools 35.0.0, plus
a JDK and ZIP utilities. Set `ANDROID_SDK_ROOT`, `ALTIMA_ANDROID_KEYSTORE`,
`ALTIMA_ANDROID_KEY_ALIAS` and `ALTIMA_ANDROID_KEYSTORE_PASSWORD`, then
run `./android/build-apk.sh /absolute/path/altima-quest-3.apk`. Keep the
same signing key for upgrades.
