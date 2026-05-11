const express = require('express');
const multer = require('multer');
const path = require('path');
const Contact = require('../models/Contact');
const requireAuth = require('../middleware/auth');

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

// ── GET /api/contacts/search?q=... — Predictive search ──────
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    // Use regex for prefix-based predictive search (works without text index too)
    const regex = new RegExp(q, 'i');
    const contacts = await Contact.find({
      owner: req.user.id,
      $or: [
        { firstName: regex },
        { lastName: regex },
        { 'phones.number': regex },
        { email: regex },
        { notes: regex },
      ],
    }).sort({ lastName: 1, firstName: 1 });

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Search failed.', error: error.message });
  }
});

// ── GET /api/contacts — Get all contacts for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const contacts = await Contact.find({ owner: req.user.id })
      .sort({ lastName: 1, firstName: 1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error: error.message });
  }
});

// ── GET /api/contacts/:id — Get a single contact by ID ──────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user.id });
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contact', error: error.message });
  }
});

// ── POST /api/contacts — Create a new contact ───────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, phones, email, address, notes } = req.body;
    const newContact = new Contact({
      owner: req.user.id,
      firstName,
      lastName,
      phones,
      email,
      address,
      notes,
    });
    const savedContact = await newContact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: 'Error creating contact', error: error.message });
  }
});

// ── PUT /api/contacts/:id — Update a contact by ID ──────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const contact = await Contact.findOneAndUpdate(
      { _id: id, owner: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(400).json({ message: 'Error updating contact', error: error.message });
  }
});

// ── DELETE /api/contacts/:id — Delete a contact by ID ───────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOneAndDelete({ _id: id, owner: req.user.id });
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contact', error: error.message });
  }
});

// ── POST /api/contacts/:id/photo — Upload a contact photo ───
router.post('/:id/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file provided.' });
    }

    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user.id });
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Save the relative URL path
    contact.photoUrl = `/uploads/${req.file.filename}`;
    await contact.save();

    res.json({ message: 'Photo uploaded successfully', photoUrl: contact.photoUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// ── POST /api/contacts/merge — Merge two contacts ───────────
router.post('/merge', requireAuth, async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;
    if (!primaryId || !secondaryId) {
      return res.status(400).json({ message: 'Both primaryId and secondaryId are required' });
    }

    const primaryContact = await Contact.findOne({ _id: primaryId, owner: req.user.id });
    const secondaryContact = await Contact.findOne({ _id: secondaryId, owner: req.user.id });

    if (!primaryContact || !secondaryContact) {
      return res.status(404).json({ message: 'One or both contacts not found' });
    }

    // Merge phones: combine arrays, avoid duplicates
    const mergedPhones = [...primaryContact.phones];
    secondaryContact.phones.forEach(phone => {
      if (!mergedPhones.some(p => p.number === phone.number)) {
        mergedPhones.push(phone);
      }
    });

    primaryContact.phones = mergedPhones;

    if (!primaryContact.email && secondaryContact.email) {
      primaryContact.email = secondaryContact.email;
    }

    if (!primaryContact.notes && secondaryContact.notes) {
      primaryContact.notes = secondaryContact.notes;
    }

    // Merge address fields
    if (secondaryContact.address) {
      if (!primaryContact.address.street && secondaryContact.address.street) {
        primaryContact.address.street = secondaryContact.address.street;
      }
      if (!primaryContact.address.city && secondaryContact.address.city) {
        primaryContact.address.city = secondaryContact.address.city;
      }
      if (!primaryContact.address.country && secondaryContact.address.country) {
        primaryContact.address.country = secondaryContact.address.country;
      }
      if (!primaryContact.address.postalCode && secondaryContact.address.postalCode) {
        primaryContact.address.postalCode = secondaryContact.address.postalCode;
      }
    }

    await primaryContact.save();
    await Contact.findByIdAndDelete(secondaryId);

    res.json({ message: 'Contacts merged successfully', contact: primaryContact });
  } catch (error) {
    res.status(500).json({ message: 'Error merging contacts', error: error.message });
  }
});

module.exports = router;