const express = require('express');
const multer = require('multer');
const path = require('path');
const requireAuth = require('../middleware/auth');
const contactService = require('../services/contactService');

const router = express.Router();

// ── Multer config for photo uploads ──────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.params.id}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

// ── GET /api/contacts — Get all contacts for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0;
    const contacts = await contactService.getAllContacts(req.user.id, page, limit);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error: error.message });
  }
});

// ── DELETE /api/contacts/all — Delete all contacts for the logged-in user
router.delete('/all', requireAuth, async (req, res) => {
  try {
    const count = await contactService.deleteAllContacts(req.user.id);
    res.json({ message: `Successfully deleted ${count} contacts.` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contacts', error: error.message });
  }
});

// ── GET /api/contacts/export — Export contacts to CSV ──────
router.get('/export', requireAuth, async (req, res) => {
  try {
    const csvData = await contactService.exportContacts(req.user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting contacts', error: error.message });
  }
});

// ── Multer config for CSV imports (separate from photo uploads) ──
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      return cb(null, true);
    }
    cb(new Error('Only CSV files are allowed.'));
  },
});

// ── POST /api/contacts/import — Import contacts from CSV ────
router.post('/import', requireAuth, csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file provided.' });
    }
    
    const count = await contactService.importContacts(req.user.id, req.file.buffer);
    
    res.json({ message: `Successfully imported ${count} contacts.` });
  } catch (error) {
    res.status(500).json({ message: 'Error importing contacts', error: error.message });
  }
});

// ── GET /api/contacts/:id — Get a single contact by ID ──────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const contact = await contactService.getContactById(req.params.id, req.user.id);
    res.json(contact);
  } catch (error) {
    if (error.message === 'Contact not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching contact', error: error.message });
  }
});

// ── POST /api/contacts — Create a new contact ───────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const savedContact = await contactService.createContact(req.user.id, req.body);
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: 'Error creating contact', error: error.message });
  }
});

// ── PUT /api/contacts/:id — Update a contact by ID ──────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.user.id, req.body);
    res.json(contact);
  } catch (error) {
    if (error.message === 'Contact not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: 'Error updating contact', error: error.message });
  }
});

// ── PUT /api/contacts/:id/favorite — Toggle favorite status
router.put('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const contact = await contactService.toggleFavorite(req.params.id, req.user.id);
    res.json(contact);
  } catch (error) {
    if (error.message === 'Contact not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: 'Error updating favorite status', error: error.message });
  }
});

// ── DELETE /api/contacts/:id — Delete a contact by ID ───────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await contactService.deleteContact(req.params.id, req.user.id);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    if (error.message === 'Contact not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting contact', error: error.message });
  }
});

// ── POST /api/contacts/:id/photo — Upload a contact photo ───
router.post('/:id/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file provided.' });
    }

    const contact = await contactService.uploadPhoto(req.params.id, req.user.id, req.file.filename);
    res.json({ message: 'Photo uploaded successfully', photoUrl: contact.photoUrl });
  } catch (error) {
    if (error.message === 'Contact not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// ── POST /api/contacts/merge — Merge two contacts ───────────
router.post('/merge', requireAuth, async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;
    const contact = await contactService.mergeContacts(primaryId, secondaryId, req.user.id);
    res.json({ message: 'Contacts merged successfully', contact });
  } catch (error) {
    if (error.message === 'One or both contacts not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Both primaryId and secondaryId are required') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error merging contacts', error: error.message });
  }
});

module.exports = router;