require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
const expressLayouts = require('express-ejs-layouts');
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// expose current path and site title to templates for active link highlighting & title
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.siteTitle = process.env.SITE_TITLE || 'Clicks by Ravi';
  // if you place a logo at public/images/logo.png, expose it to templates
  // prefer an uploaded logo at public/uploads/logo1_black.png if present
  if (fs.existsSync(path.join(__dirname, 'public', 'images', 'logo1_black.png'))) {
    res.locals.siteTitleLogo = '/images/logo1_black.png';
  } else if (fs.existsSync(path.join(__dirname, 'public', 'images', 'logo.png'))) {
    res.locals.siteTitleLogo = '/images/logo.png';
  } else {
    // generate a small SVG data URI as a fallback logo using the site title
    const title = (process.env.SITE_TITLE || 'Clicks by Ravi').replace(/</g, '').replace(/>/g, '');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='40'><rect fill='transparent' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='14' fill='%23222'>${title.replace(/\s/g, '_').toUpperCase()}</text></svg>`;
    res.locals.siteTitleLogo = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  // remove header background image and placeholder — header will have no background image
  res.locals.headerImage = null;
  res.locals.hasHeaderImage = false;
  // no page background image by default
  res.locals.homeBackground = null;
  next();
});

// Helper to fetch images from local folder
async function readGallery(folderName) {
  try {
    const localDir = path.join(__dirname, 'public', 'uploads', folderName);
    const images = [];
    if (!fs.existsSync(localDir)) return images;

    const allowed = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

    // read files (non-recursive). If folder contains subfolders (like portfolio/<cat>), attempt to list those too.
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (allowed.has(ext)) {
          images.push({ src: `/uploads/${folderName}/${ent.name}`, caption: '', filename: ent.name });
        }
      } else if (ent.isDirectory()) {
        // list files in subdirectory
        const subdir = path.join(localDir, ent.name);
        const subFiles = fs.readdirSync(subdir, { withFileTypes: true });
        for (const sf of subFiles) {
          if (sf.isFile() && allowed.has(path.extname(sf.name).toLowerCase())) {
            images.push({ src: `/uploads/${folderName}/${ent.name}/${sf.name}`, caption: '', filename: `${ent.name}/${sf.name}` });
          }
        }
      }
    }

    return images;
  } catch (err) {
    console.error(`readGallery error for ${folderName}:`, err);
    return [];
  }
}

// Collect all images from clients and portfolio folders for home page display
async function collectAllUploads() {
  const allImages = [];

  // Get images from clients folder
  const clientImages = await readGallery('clients');
  allImages.push(...clientImages);

  // Get images from all portfolio categories
  const portfolioCategories = ['life-events', 'wildlife', 'portraits', 'landscapes'];
  for (const cat of portfolioCategories) {
    const categoryImages = await readGallery(`portfolio/${cat}`);
    allImages.push(...categoryImages);
  }

  return allImages;
}

app.get('/', async (req, res) => {
  const images = await collectAllUploads();
  res.render('pages/home', { title: process.env.SITE_TITLE || 'Clicks by Ravi', images });
});

app.get('/about', async (req, res) => {
  const aboutImages = await readGallery('About');
  const aboutImage = aboutImages.length > 0 ? aboutImages[0].src : 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
  res.render('pages/about', { title: 'About', aboutImage });
});

app.get('/clients', async (req, res) => {
  const images = await readGallery('clients');
  res.render('pages/clients', { title: 'Clients', images });
});

const portfolioCategories = ['life-events', 'wildlife', 'portraits', 'landscapes'];
app.get('/portfolio', async (req, res) => {
  const galleries = {};
  // Fetch all categories in parallel
  await Promise.all(portfolioCategories.map(async cat => {
    galleries[cat] = await readGallery(`portfolio/${cat}`);
  }));

  // default landing category
  const defaultCategory = 'life-events';
  res.render('pages/portfolio', { title: 'Portfolio', galleries, categories: portfolioCategories, defaultCategory });
});

app.get('/portfolio/:category', async (req, res) => {
  const cat = req.params.category;
  if (!portfolioCategories.includes(cat)) return res.status(404).send('Not found');
  const images = await readGallery(`portfolio/${cat}`);
  res.render('pages/portfolio-category', { title: `Portfolio - ${cat}`, category: cat, images });
});

// Contact form
app.get('/contact', (req, res) => {
  // provide default locals expected by the template to avoid ReferenceError
  res.render('pages/contact', { title: 'Contact', error: null, success: null, form: {} });
});

app.post('/contact', async (req, res) => {
  const { name, email, message, phone, eventType } = req.body;
  if (!name || !email || !message) {
    return res.status(400).render('pages/contact', { title: 'Contact', error: 'Please fill Name, Email and Message', success: null, form: req.body });
  }
  // Create transporter: prefer explicit SMTP settings, otherwise fall back to Ethereal in dev
  let transporter;
  let usingEthereal = false;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: (process.env.SMTP_SECURE === 'true') || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else if (process.env.NODE_ENV !== 'production') {
    // create a test account for dev using Ethereal
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      usingEthereal = true;
      console.log('Using Ethereal test account for outgoing email (dev only)');
    } catch (e) {
      console.error('Failed to create Ethereal test account', e);
      return res.status(500).render('pages/contact', { title: 'Contact', error: 'Email could not be configured for testing.', success: null, form: req.body });
    }
  } else {
    console.error('SMTP not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in .env to enable sending emails.');
    return res.status(500).render('pages/contact', { title: 'Contact', error: 'Email server is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS in your environment to enable sending.', success: null, form: req.body });
  }

  const mailTo = process.env.MAIL_TO || 'ravi.clicksby@gmail.com';
  const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';

  const subject = `Website contact from ${name}`;
  const bodyLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || ''}`,
    `Event type: ${eventType || ''}`,
    '',
    'Message:',
    message || ''
  ];

  const mailOptions = {
    from: mailFrom,
    to: mailTo,
    subject,
    text: bodyLines.join('\n')
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (usingEthereal) {
      const preview = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal preview URL:', preview);
      res.render('pages/contact', { title: 'Contact', error: null, success: `Message sent (dev preview): ${preview}`, form: {} });
    } else {
      res.render('pages/contact', { title: 'Contact', error: null, success: 'Message sent successfully', form: {} });
    }
  } catch (err) {
    console.error('sendMail error', err);
    res.status(500).render('pages/contact', { title: 'Contact', error: 'Could not send message. Check server logs or email settings.', success: null, form: req.body });
  }
});

// Local Storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'home_gallery';
    const targetFolder = req.body.target || 'clients';

    if (targetFolder === 'clients') folder = 'clients';
    else if (targetFolder === 'portfolio') {
      const cat = req.body.category || 'life-events';
      if (portfolioCategories.includes(cat)) folder = `portfolio/${cat}`;
    }

    const uploadPath = path.join(__dirname, 'public', 'uploads', folder);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Admin upload endpoint
app.post('/admin/upload', upload.single('image'), (req, res) => {
  const secret = req.query.secret || req.body.secret;
  if (!secret || secret !== process.env.UPLOAD_SECRET) {
    return res.status(403).send('Forbidden');
  }

  if (!req.file) return res.status(400).send('No file uploaded');

  res.send(`Uploaded to: ${req.file.path}`);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
