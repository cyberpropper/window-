# window++

Single-page calculator for soft windows powered by Node.js/Express. Static assets live in `public/`; pricing and credentials are kept in JSON files under `data/`.

## Getting started
- Node.js 18+.
- Install deps: `npm install`.
- Run dev server: `npm start` (honours `PORT`, defaults to `4000`).

## Data storage
- `data/prices.json` — materials, labor, edging, hardware and extras. This file is read by the UI and can be edited through the built-in JSON editor.
- `data/secrets.json` — stores `priceEditorPassword` (default: `changeme`). Update it via the API or the editor UI.

## API
- `GET /api/prices` — returns JSON pricing data from `data/prices.json`.
- `POST /api/prices` — body `{ data, password }`; saves `data` into `data/prices.json` when `password` matches `priceEditorPassword`.
- `POST /api/prices/password` — body `{ currentPassword, newPassword }`; updates `priceEditorPassword` in `data/secrets.json`.
- `POST /api/calc` — body with window options (shape, widthCm, heightCm, materialId, edgingPricePerM, grommetStep, extras...) and returns calculated totals. Frontend uses this endpoint so расчёты и прайсы остаются на сервере.

No login is required to use the calculator. The password only protects the price editor endpoint.
