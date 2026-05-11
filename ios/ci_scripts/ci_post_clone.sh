#!/bin/sh
# Xcode Cloud post-clone - Expo + Node install + fmt patch
set -eux
export HOMEBREW_NO_INSTALL_CLEANUP=1
export HOMEBREW_NO_INSTALLED_DEPENDENTS_CHECK=1
brew install node
export CI=true

# Unset Apple internal proxy + force HTTPS for pod git clones
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
git config --global url."https://github.com/".insteadOf "git@github.com:"
git config --global url."https://github.com/".insteadOf "http://github.com/"

cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install --legacy-peer-deps --no-audit --no-fund

# Force CI=true in the RN bundle script wrapper (xcodebuild's script
# phases inherit Apple's CI=TRUE which @expo/cli getenv rejects)
RN_XCODE_SCRIPT=node_modules/react-native/scripts/react-native-xcode.sh
if [ -f "$RN_XCODE_SCRIPT" ]; then
  echo "==> Forcing CI=true at top of $RN_XCODE_SCRIPT"
  perl -i -pe 'print "export CI=true\n" if $. == 2 && !$done++' "$RN_XCODE_SCRIPT"
fi

npx expo prebuild --platform ios --no-install --clean
cd ios
pod install

# Xcode 26 clang rejects fmt's consteval template instantiations in
# Pods/fmt/include/fmt/format-inl.h. Hermes uses fmt as header-only,
# so the macro path doesn't reach the instantiation sites. Patch
# fmt's headers directly: consteval -> constexpr (superset, runtime
# behavior unchanged).
echo "==> Patching fmt headers: consteval -> constexpr"
echo "    BEFORE: $(grep -rE '\bconsteval\b' Pods/fmt/include/ 2>/dev/null | wc -l) consteval occurrences"
find Pods/fmt -type f \( -name "*.h" -o -name "*.hpp" -o -name "*.cc" \) \
  -exec perl -pi -e 's/\bconsteval\b/constexpr/g' {} +
echo "    AFTER:  $(grep -rE '\bconsteval\b' Pods/fmt/include/ 2>/dev/null | wc -l) consteval occurrences"
