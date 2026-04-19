/**
 * Main application server for Clicks by Ravi.
 * Initializes Express, configures middleware, defines template paths, and routes user traffic.
 */

// ==========================================
// 1. Dependencies and Environment Setup
// ==========================================
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 2. View Engine and Layouts Setup
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // Sets the default layout template

// ==========================================
// 3. Static Assets and Body Parsing
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies for form submissions

// ==========================================
// 4. Global Template Middleware
// ==========================================
/**
 * Middleware that runs on every request to inject standard variables into EJS templates.
 * Provides active route tracking, dynamic branding, and layout visibility flags.
 */
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.siteTitle = process.env.SITE_TITLE || 'Clicks by Ravi';
  
  // Conditionally assign logo path based on filesystem priority
  if (fs.existsSync(path.join(__dirname, 'public', 'images', 'logo1_black.png'))) {
    res.locals.siteTitleLogo = '/images/logo1_black.png';
  } else if (fs.existsSync(path.join(__dirname, 'public', 'images', 'logo.png'))) {
    res.locals.siteTitleLogo = '/images/logo.png';
  } else {
    // Generate an SVG data URI as an organic fallback logo
    const title = (process.env.SITE_TITLE || 'Clicks by Ravi').replace(/</g, '').replace(/>/g, '');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='40'><rect fill='transparent' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='14' fill='%23222'>${title.replace(/\s/g, '_').toUpperCase()}</text></svg>`;
    res.locals.siteTitleLogo = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // Define layout presentation flags
  res.locals.headerImage = null;
  res.locals.hasHeaderImage = false;
  res.locals.homeBackground = null;
  
  next();
});

// ==========================================
// 5. Helper Functions
// ==========================================
/**
 * Reads the public uploads folder to extract image metadata.
 * Supports reading directly from a specified subfolder, checking for common image extensions.
 * 
 * @param {string} folderName - The relative path inside 'public/uploads' to scan.
 * @returns {Promise<Array>} A list of image objects containing `src`, `caption`, and `filename`.
 */
async function readGallery(folderName) {
  try {
    const localDir = path.join(__dirname, 'public', 'uploads', folderName);
    const images = [];
    if (!fs.existsSync(localDir)) return images;

    const allowed = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

    // Non-recursive folder traversal
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (allowed.has(ext)) {
          images.push({ src: `/uploads/${folderName}/${ent.name}`, caption: '', filename: ent.name });
        }
      } else if (ent.isDirectory()) {
        // Attempt one level deeper for subcategories
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

/**
 * Aggregates all uploaded client images and portfolio categories for the frontpage gallery display.
 * @returns {Promise<Array>} An array of all compiled image entities.
 */
async function collectAllUploads() {
  const allImages = [];
  
  // Aggregate Client specific images
  const clientImages = await readGallery('clients');
  allImages.push(...clientImages);

  // Aggregate Portfolio specific images loop
  const portfolioCategories = ['life-events', 'wildlife', 'portraits', 'landscapes'];
  for (const cat of portfolioCategories) {
    const categoryImages = await readGallery(`portfolio/${cat}`);
    allImages.push(...categoryImages);
  }

  return allImages;
}

// ==========================================
// 6. Page Routes
// ==========================================
const portfolioCategories = ['life-events', 'wildlife', 'portraits', 'landscapes'];

/** Home Page Content Route */
app.get('/', async (req, res) => {
  const images = await collectAllUploads();
  res.render('pages/home', { title: process.env.SITE_TITLE || 'Clicks by Ravi', images });
});

/** About Page Content Route */
app.get('/about', async (req, res) => {
  const aboutImages = await readGallery('About');
  const aboutImage = aboutImages.length > 0 
    ? aboutImages[0].src 
    : 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
    
  res.render('pages/about', { title: 'About', aboutImage });
});

/** Clients Deliverables / Snippets Route */
app.get('/clients', async (req, res) => {
  const images = await readGallery('clients');
  res.render('pages/clients', { title: 'Clients', images });
});

/** Base Portfolio Showcase Route */
app.get('/portfolio', async (req, res) => {
  const galleries = {};
  
  // Parallel asynchronous fetching of all categories
  await Promise.all(portfolioCategories.map(async cat => {
    galleries[cat] = await readGallery(`portfolio/${cat}`);
  }));

  const defaultCategory = 'life-events';
  res.render('pages/portfolio', { title: 'Portfolio', galleries, categories: portfolioCategories, defaultCategory });
});

/** Portfolio Sub-Category Showcase Route */
app.get('/portfolio/:category', async (req, res) => {
  const cat = req.params.category;
  if (!portfolioCategories.includes(cat)) return res.status(404).send('Not found');
  
  const images = await readGallery(`portfolio/${cat}`);
  res.render('pages/portfolio-category', { title: `Portfolio - ${cat}`, category: cat, images });
});

// ==========================================
// 7. Contact Routes (Nodemailer Logic)
// ==========================================
/** Render initial interactive contact form */
app.get('/contact', (req, res) => {
  res.render('pages/contact', { title: 'Contact', error: null, success: null, form: {} });
});

/** Post submission handler translating contact details into outgoing email. */
app.post('/contact', async (req, res) => {
  const { name, email, message, phone, eventType } = req.body;
  if (!name || !email || !message) {
    return res.status(400).render('pages/contact', { title: 'Contact', error: 'Please fill Name, Email and Message', success: null, form: req.body });
  }

  let transporter;
  let usingEthereal = false;
  
  // Determine transport approach based on environment secrets / nodes.
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

// ==========================================
// 8. Admin Interfacing & File Context Handlers
// ==========================================
/** Local storage strategy for incoming administrative file uploads */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'home_gallery';
    const targetFolder = req.body.target || 'clients';

    // Route storage logic depending on category properties
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

// Middleware layer initialization for uploads
const upload = multer({ storage: storage });

/** Single Image Upload Endpoint - Restricted via simplistic secret check */
app.post('/admin/upload', upload.single('image'), (req, res) => {
  const secret = req.query.secret || req.body.secret;
  
  if (!secret || secret !== process.env.UPLOAD_SECRET) {
    return res.status(403).send('Forbidden');
  }

  if (!req.file) return res.status(400).send('No file uploaded');

  res.send(`Uploaded to: ${req.file.path}`);
});

// ==========================================
// 9. Startup Sequence Implementation
// ==========================================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
