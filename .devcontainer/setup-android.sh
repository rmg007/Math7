#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
# Java is installed via devcontainer Feature.
sudo apt-get install -y unzip curl

ANDROID_SDK_ROOT="${HOME}/android-sdk"

mkdir -p "${ANDROID_SDK_ROOT}/cmdline-tools"

if [ ! -d "${ANDROID_SDK_ROOT}/cmdline-tools/latest" ]; then
  cd /tmp
  curl -L -o cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  unzip -q cmdline-tools.zip
  mkdir -p "${ANDROID_SDK_ROOT}/cmdline-tools/latest"
  mv cmdline-tools/* "${ANDROID_SDK_ROOT}/cmdline-tools/latest/"
fi

# Some SDK tools expect this file to exist
mkdir -p "${HOME}/.android"
touch "${HOME}/.android/repositories.cfg"

export ANDROID_SDK_ROOT
export ANDROID_HOME="${ANDROID_SDK_ROOT}"
export PATH="${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${PATH}"

yes | sdkmanager --licenses
sdkmanager \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0"

# Persist for future shells (terminal, scripts, CI, etc.)
# Writes absolute paths for this container user.
sudo tee /etc/profile.d/android-sdk.sh > /dev/null <<EOF
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT}"
export ANDROID_HOME="${ANDROID_SDK_ROOT}"
export PATH="${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:\$PATH"
EOF

# Make the variables available to *this* process as well.
# shellcheck disable=SC1091
source /etc/profile.d/android-sdk.sh

echo "Android SDK installed at: ${ANDROID_SDK_ROOT}"
