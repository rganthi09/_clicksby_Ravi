# Clicks by Ravi — Photography portfolio (sample scaffold)

This is a small Node.js + Express scaffold for a photography portfolio. It uses EJS templates and reads images directly from folders under `public/uploads` so adding photos is as simple as copying files into the correct folder.

Features
- Home, About, Clients, Portfolio, Contact pages
- Portfolio categories: life-events, wildlife, portraits, landscapes
- Dynamic galleries: images are read from `public/uploads/*` automatically
- Contact form that sends email using SMTP (Nodemailer) configured via `.env`
- Optional simple admin upload endpoint (see below)

Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```powershell
npm install
```

3. Run the app:

```powershell
npm run dev
```

Open http://localhost:3000

Adding images
- Clients: copy images into `public/uploads/clients`
- Portfolio categories: `public/uploads/portfolio/life-events`, `.../wildlife`, `.../portraits`, `.../landscapes`

The site will list any images in those folders automatically with no limit.

Contact email
Fill SMTP values in the `.env` file. Example using Gmail (not recommended for production):

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="Clicks by Ravi <no-reply@yourdomain.com>"
MAIL_TO=your-email@example.com

Admin upload endpoint (optional)
There is a basic upload endpoint at `POST /admin/upload` which accepts multipart/form-data (field name `image`). It must include the `secret` field (or ?secret= query) matching `UPLOAD_SECRET` in `.env`.

Example (PowerShell using curl):

```powershell
curl -F "image=@C:\path\to\photo.jpg" -F "target=portfolio" -F "category=wildlife" "http://localhost:3000/admin/upload?secret=change-me"
```

Security note: This endpoint is intentionally minimal. For production use, replace it with proper authentication.

Deployment
- Any Node host (Render, Heroku, Fly) will work. Set environment variables on the host.

Next steps (suggested)
- Add image thumbnails or lazy-loading for performance
- Add pagination or infinite scroll for large galleries
- Add proper admin UI with user authentication for uploads
- Add EXIF display or lightbox gallery
