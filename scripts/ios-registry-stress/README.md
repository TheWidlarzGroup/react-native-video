# VideoManager registry stress harness

Reproduces the data race that caused `EXC_BREAKPOINT` crashes in
`VideoManager.configureAudioSession` (react-native-video 7.0.0-beta.10), and proves that
`SynchronizedHashTable` fixes it.

## Run

```bash
swiftc -O -o /tmp/rnv-stress \
  scripts/ios-registry-stress/main.swift \
  packages/react-native-video/ios/core/SynchronizedHashTable.swift

/tmp/rnv-stress unsafe 15   # control arm - MUST crash
/tmp/rnv-stress safe 15     # shipped class - MUST survive, exit 0
```

Entry point is named `main.swift`, not `stress.swift`: `swiftc` only allows top-level
(non-declaration) code across multiple input files when that file is literally named
`main.swift`.

## Reading the result

| Arm | Exit | Meaning |
|---|---|---|
| `unsafe` | crash (134 / 133 / 139) | expected - the harness is stressing hard enough |
| `unsafe` | 2 (`SURVIVED`) | inconclusive - raise the duration, the run proves nothing |
| `safe` | 0 (`SURVIVED`) | pass |
| `safe` | crash | regression |

The `unsafe` arm may die as `SIGABRT` (Foundation's "collection was mutated while being
enumerated" guard wins) or as `SIGTRAP`/`EXC_BREAKPOINT` (a torn read reaches Swift's
array-bridging precondition). Both are the same race; production crash reports showed the
`SIGTRAP` branch.
