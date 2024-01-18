#!/bin/bash

if which ktlint >/dev/null; then
  cd android && ktlint --color --relative --editorconfig=./.editorconfig -F ./**/*.kt*
else
  echo "[ERROR]: KTLint is not installed - Install with 'brew install ktlint' (or manually from https://github.com/pinterest/ktlint)"
fi