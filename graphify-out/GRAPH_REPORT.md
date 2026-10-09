# Graph Report - al-ashqar-frontend  (2026-10-09)

## Corpus Check
- 43 files · ~46,323 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 198 nodes · 341 edges · 17 communities (15 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cf8e39d3`
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `authHeaders()` - 25 edges
2. `imgUrl()` - 9 edges
3. `uploadProductImage()` - 8 edges
4. `useCart()` - 7 edges
5. `adminGetCategories()` - 7 edges
6. `adminGetProducts()` - 6 edges
7. `getSettings()` - 6 edges
8. `scripts` - 5 edges
9. `ErrorBoundary` - 5 edges
10. `adminCreateProduct()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `InvoiceModal()` --calls--> `imgUrl()`  [EXTRACTED]
  src/pages/Admin/Orders/Orders.jsx → src/services/api.js
- `CartDrawer()` --calls--> `useCart()`  [EXTRACTED]
  src/components/CartDrawer/CartDrawer.jsx → src/context/CartContext.jsx
- `Footer()` --calls--> `formatWhatsappPhone()`  [EXTRACTED]
  src/components/Footer/Footer.jsx → src/services/api.js
- `Header()` --calls--> `useCart()`  [EXTRACTED]
  src/components/Header/Header.jsx → src/context/CartContext.jsx
- `ProductCard()` --calls--> `imgUrl()`  [EXTRACTED]
  src/components/ProductCard/ProductCard.jsx → src/services/api.js

## Import Cycles
- None detected.

## Communities (17 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (15): CartDrawer(), CartContext, useCart(), Header(), ProductCard(), SORT_OPTIONS, ProductPage(), api (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (25): dependencies, axios, browser-image-compression, react, react-dom, react-router-dom, devDependencies, eslint (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (5): CartProvider(), ErrorBoundary, AdminApp, Login, SearchPage

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (4): EMPTY, adminCreateCategory(), adminDeleteCategory(), adminUpdateCategory()

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (4): navItems, InvoiceModal(), STATUS, adminGetOrders()

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (6): fmt(), Parcels(), QUICK_SIZES, adminDeleteParcel(), adminGetParcels(), adminUpdateParcel()

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (13): QUICK_SIZES, adminGetSettings(), adminUpdateSettings(), createOrder(), validateDiscountCode(), EMPTY_DISCOUNT, EMPTY_METHOD, Settings() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.35
Nodes (9): adminConfirmOrder(), adminCreateAnnouncement(), adminCreateParcel(), adminDeleteAnnouncement(), adminDeleteOrder(), adminGetAnnouncements(), adminGetParcel(), adminToggleAnnouncement() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (3): adminGetCategories(), adminGetDashboardStats(), adminGetProducts()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (7): EMPTY_FORM, PRESET_LABELS, QUICK_SIZES, adminCreateProduct(), adminDeleteProduct(), adminToggleProduct(), adminUpdateProduct()

### Community 12 - "Community 12"
Cohesion: 0.40
Nodes (4): uploadFile(), uploadImage(), uploadProductImage(), compressBeforeUpload()

### Community 13 - "Community 13"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + Vite

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (5): CollectionBanner(), getCountdown(), Footer(), formatWhatsappPhone(), getSettings()

## Knowledge Gaps
- **43 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `imgUrl()` connect `Community 0` to `Community 4`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `adminGetOrders()` connect `Community 4` to `Community 7`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09246088193456614 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._