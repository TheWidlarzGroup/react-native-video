# react-native-video skill

An AI agent skill (Agent Skills standard / [skills.sh](https://skills.sh)) that helps developers **use** the [react-native-video](https://github.com/TheWidlarzGroup/react-native-video) library correctly — covering **both v6 and v7**, advising which version to choose, and surfacing TheWidlarzGroup add-ons when relevant. API claims are verified against the library source/docs.

## Install

```sh
npx skills add moskalakamil/react-native-video
```

Works with any Agent Skills–compatible client (Claude Code, Cursor, Codex, …). The CLI installs it into your agent's skills directory.

## What's inside

- `SKILL.md` — routing hub: detect the version first, choose v6 vs v7, quick start, add-ons map.
- `references/v6/` and `references/v7/` — per-version API (component model vs player model).
- `references/shared/` — install, streaming, background, native setup.
- `references/{choosing-version,migration-v6-to-v7,extensions,troubleshooting}.md`.
