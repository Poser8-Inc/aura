#!/bin/sh
# Xcode Cloud post-clone — runs from ios/ci_scripts where Apple actually looks
set -eux
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
npx expo prebuild --platform ios --no-install --clean
cd ios
pod install
