# Graph Report - al-ashqar-frontend  (2026-09-04)

## Corpus Check
- 40 files · ~42,677 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 177 nodes · 298 edges · 19 communities (14 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6b844b9e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `authHeaders()` - 20 edges
2. `imgUrl()` - 9 edges
3. `useCart()` - 7 edges
4. `uploadProductImage()` - 7 edges
5. `adminGetCategories()` - 6 edges
6. `getSettings()` - 6 edges
7. `scripts` - 5 edges
8. `ErrorBoundary` - 5 edges
9. `adminGetProducts()` - 5 edges
10. `formatWhatsappPhone()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `CartDrawer()` --calls--> `useCart()`  [EXTRACTED]
  src/components/CartDrawer/CartDrawer.jsx → src/context/CartContext.jsx
- `Footer()` --calls--> `formatWhatsappPhone()`  [EXTRACTED]
  src/components/Footer/Footer.jsx → src/services/api.js
- `Header()` --calls--> `useCart()`  [EXTRACTED]
  src/components/Header/Header.jsx → src/context/CartContext.jsx
- `ProductCard()` --calls--> `imgUrl()`  [EXTRACTED]
  src/components/ProductCard/ProductCard.jsx → src/services/api.js
- `InvoiceModal()` --calls--> `imgUrl()`  [EXTRACTED]
  src/pages/Admin/Orders/Orders.jsx → src/services/api.js

## Import Cycles
- None detected.

## Communities (19 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (10): Footer(), SORT_OPTIONS, api, createOrder(), formatWhatsappPhone(), getAnnouncements(), getCategories(), getProducts() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (25): dependencies, axios, browser-image-compression, react, react-dom, react-router-dom, devDependencies, eslint (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (10): CartDrawer(), CartContext, CartProvider(), useCart(), Header(), ProductPage(), getProduct(), AdminApp (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (9): EMPTY, adminConfirmOrder(), adminCreateCategory(), adminDeleteCategory(), adminDeleteOrder(), adminDeleteProduct(), adminGetCategories(), adminUpdateCategory() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (5): InvoiceModal(), STATUS, ProductCard(), adminGetOrders(), imgUrl()

### Community 6 - "Community 6"
Cohesion: 0.27
Nodes (8): adminGetSettings(), EMPTY_METHOD, Settings(), PRESET_LOGOS, PRESET_MAP, resolveCardTheme(), resolveLogoSrc(), THEME_MAP

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (3): adminCreateAnnouncement(), adminDeleteAnnouncement(), adminToggleAnnouncement()

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (3): QUICK_SIZES, adminUpdateProduct(), adminUpdateSettings()

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (3): adminGetAnnouncements(), adminGetDashboardStats(), adminGetProducts()

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (5): EMPTY_FORM, PRESET_LABELS, QUICK_SIZES, adminCreateProduct(), adminToggleProduct()

### Community 12 - "Community 12"
Cohesion: 0.60
Nodes (4): uploadFile(), uploadImage(), uploadProductImage(), compressBeforeUpload()

### Community 13 - "Community 13"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

## Knowledge Gaps
- **41 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `imgUrl()` connect `Community 5` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `adminGetOrders()` connect `Community 5` to `Community 3`, `Community 4`, `Community 12`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10227272727272728 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._