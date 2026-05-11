const express = require('express');
const Contact = require('../models/Contact');

const router = express.Router();

// Middleware to check if user is authenticated (assuming req.user is set by auth middleware)
// const requireAuth = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }
//   next();
// };

// For prototype, temporarily disable auth
const requireAuth = (req, res, next) => {
    // Mock user ID for testing
    req.user = { id: '507f1f77bcf86cd799439011' }; // Example ObjectId
    next();
};

// GET /api/contacts - Get all contacts for the logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const contacts = await Contact.find({ owner: req.user.id });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching contacts', error: error.message });
    }
});

// POST /api/contacts - Create a new contact
router.post('/', requireAuth, async (req, res) => {
    try {
        const { firstName, lastName, phones, email, address } = req.body;
        const newContact = new Contact({
            owner: req.user.id,
            firstName,
            lastName,
            phones,
            email,
            address,
        });
        const savedContact = await newContact.save();
        res.status(201).json(savedContact);
    } catch (error) {
        res.status(400).json({ message: 'Error creating contact', error: error.message });
    }
});

// PUT /api/contacts/:id - Update a contact by ID
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

// DELETE /api/contacts/:id - Delete a contact by ID
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

// POST /api/contacts/merge - Merge two contacts
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

        // Update primary contact with merged data
        primaryContact.phones = mergedPhones;
        // Optionally merge other fields if needed, e.g., email, address
        if (!primaryContact.email && secondaryContact.email) {
            primaryContact.email = secondaryContact.email;
        }
        // For address, perhaps keep primary or merge intelligently

        await primaryContact.save();

        // Delete secondary contact
        await Contact.findByIdAndDelete(secondaryId);

        res.json({ message: 'Contacts merged successfully', contact: primaryContact });
    } catch (error) {
        res.status(500).json({ message: 'Error merging contacts', error: error.message });
    }
});

module.exports = router;