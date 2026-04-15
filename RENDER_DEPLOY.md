# Deploy On Render (Single Service)

This project is configured to deploy as one full website on Render (frontend + backend + socket + APIs).

## 1) Push To GitHub

Push this repo to GitHub/GitLab.

## 2) Create Render Service

1. Open Render dashboard.
2. Click `New` -> `Blueprint`.
3. Select your repo.
4. Render will detect `render.yaml` automatically.

## 3) Set Required Environment Variables

In Render service settings, set:

- `MONGODB_URI`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`

## 4) Deploy

Render will run:

- Build: `npm install && npm run build`
- Start: `npm run start`

## 5) Verify

After deploy:

- Website: `https://<your-render-url>`
- Health check: `https://<your-render-url>/health`
- Admin login: `https://<your-render-url>/admin/login`

## Notes

- You do not need separate frontend hosting for this setup.
- Frontend uses same-origin API/socket URLs in production automatically.
