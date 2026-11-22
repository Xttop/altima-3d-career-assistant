#!/usr/bin/env bash
set -euo pipefail

module_dir=$(cd "$(dirname "$0")" && pwd)
sdk=${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}
: "${sdk:?Set ANDROID_SDK_ROOT to your Android SDK directory}"
tools="$sdk/build-tools/35.0.0"
platform="$sdk/platforms/android-35/android.jar"
: "${ALTIMA_ANDROID_KEYSTORE:?Set ALTIMA_ANDROID_KEYSTORE to your signing keystore path}"
: "${ALTIMA_ANDROID_KEY_ALIAS:?Set ALTIMA_ANDROID_KEY_ALIAS to your signing alias}"
: "${ALTIMA_ANDROID_KEYSTORE_PASSWORD:?Set ALTIMA_ANDROID_KEYSTORE_PASSWORD in your environment}"

output=${1:-"$PWD/altima-quest-3.apk"}
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/res/drawable" "$work/classes" "$work/dex"
cp "$module_dir/../assets/app-icon-192.png" "$work/res/drawable/altima.png"
"$tools/aapt2" compile --dir "$work/res" -o "$work/resources.zip"
"$tools/aapt2" link -I "$platform" --manifest "$module_dir/AndroidManifest.xml" \
    -o "$work/base.apk" "$work/resources.zip"
javac --release 8 -classpath "$platform" -d "$work/classes" \
    "$module_dir/src/com/xttopbio/altima/MainActivity.java"
jar cf "$work/classes.jar" -C "$work/classes" .
"$tools/d8" --lib "$platform" --min-api 26 --output "$work/dex" "$work/classes.jar"
(cd "$work/dex" && zip -q "$work/base.apk" classes.dex)
"$tools/zipalign" -p -f 4 "$work/base.apk" "$work/aligned.apk"
"$tools/apksigner" sign --ks "$ALTIMA_ANDROID_KEYSTORE" --ks-key-alias "$ALTIMA_ANDROID_KEY_ALIAS" \
    --ks-pass env:ALTIMA_ANDROID_KEYSTORE_PASSWORD --out "$output" "$work/aligned.apk"
"$tools/apksigner" verify --verbose "$output"
