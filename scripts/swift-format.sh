#!/bin/bash

if which swiftformat >/dev/null; then
  cd ios && swiftformat --quiet .
else
  echo "[ERROR]: SwiftFormat is not installed -Install with 'brew install swiftformat' (or manually from https://github.com/nicklockwood/SwiftFormat)"
fi