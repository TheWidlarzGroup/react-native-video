#!/bin/bash

if which clang-format >/dev/null; then
  find ios -type f \( -name "*.h" -o -name "*.cpp" -o -name "*.m" -o -name "*.mm" \) -print0 | while read -d $'\0' file; do
    clang-format -style=file:./ios/.clang-format -i "$file"
  done
else
  echo "[ERROR]: clang-format is not installed - Install with 'brew install clang-format' (or manually from https://clang.llvm.org/docs/ClangFormat.html)"
fi