### Instalation

To install the dependencies, run at the root of the repository:

```
$ bun install
```

### Development

To start a local development server with hot-reloading, run:

```
$ bun run start
```

### Deployment

Deployment is handled via GitHub Actions. Upon pushing to the `master` branch content from the `docs` directory is automatically deployed to GitHub Pages.

### Custom Props

Custom props are provided by the `@widlarzgroup/docusaurus-ui` package and allow you to display badges and other UI elements. Custom props can be defined in three places:

#### 1. In `_category_.json` (for entire categories)

```json
{
  "label": "Analytics",
  "position": 7,
  "customProps": {
    "badgeType": "new"
  }
}
```

#### 2. In markdown frontmatter (for individual pages)

```md
---
sidebar_position: 5
sidebar_label: Chapters
customProps:
  plan: pro
---
```

#### 3. In `sidebars.ts` (for sidebar items)

```ts
{
  type: 'doc',
  id: 'some-doc',
  customProps: {
    badgeType: 'new'
  }
}
```

#### Available Custom Props

| Prop | Values | Description |
|------|--------|-------------|
| `badgeType` | `"new"`, `"preview"` | Displays a "NEW" or "PREVIEW" badge next to the item |
| `plan` | `"pro"` | Displays a "PRO" badge indicating premium/commercial feature |
