const Contact = require('../models/Contact');

class ContactService {
  async getAllContacts(userId, page = 1, limit = 0) {
    const query = Contact.find({ owner: userId }).sort({ lastName: 1, firstName: 1 });
    
    // Limit = 0 means fetch all.
    if (limit > 0) {
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
    }
    
    return await query.exec();
  }

  async deleteAllContacts(userId) {
    const result = await Contact.deleteMany({ owner: userId });
    return result.deletedCount;
  }

  async toggleFavorite(contactId, userId) {
    const contact = await Contact.findOne({ _id: contactId, owner: userId });
    if (!contact) {
      throw new Error('Contact not found');
    }
    contact.isFavorite = !contact.isFavorite;
    await contact.save();
    return contact;
  }

  async getContactById(contactId, userId) {
    const contact = await Contact.findOne({ _id: contactId, owner: userId });
    if (!contact) {
      throw new Error('Contact not found');
    }
    return contact;
  }

  async createContact(userId, data) {
    const { firstName, lastName, phones, email, address, notes } = data;
    const newContact = new Contact({
      owner: userId,
      firstName,
      lastName,
      phones,
      email,
      address,
      notes,
    });
    return await newContact.save();
  }

  async updateContact(contactId, userId, updates) {
    const contact = await Contact.findOneAndUpdate(
      { _id: contactId, owner: userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!contact) {
      throw new Error('Contact not found');
    }
    return contact;
  }

  async deleteContact(contactId, userId) {
    const contact = await Contact.findOneAndDelete({ _id: contactId, owner: userId });
    if (!contact) {
      throw new Error('Contact not found');
    }
    return contact;
  }

  async uploadPhoto(contactId, userId, filename) {
    const contact = await Contact.findOne({ _id: contactId, owner: userId });
    if (!contact) {
      throw new Error('Contact not found');
    }
    contact.photoUrl = `/uploads/${filename}`;
    await contact.save();
    return contact;
  }

  async mergeContacts(primaryId, secondaryId, userId) {
    if (!primaryId || !secondaryId) {
      throw new Error('Both primaryId and secondaryId are required');
    }

    const primaryContact = await Contact.findOne({ _id: primaryId, owner: userId });
    const secondaryContact = await Contact.findOne({ _id: secondaryId, owner: userId });

    if (!primaryContact || !secondaryContact) {
      throw new Error('One or both contacts not found');
    }

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

    return primaryContact;
  }

  async exportContacts(userId) {
    const contacts = await Contact.find({ owner: userId }).lean();
    
    // Simple CSV generation
    const header = ['FirstName', 'LastName', 'Email', 'Phones', 'Notes'];
    const rows = contacts.map(c => {
      const phones = c.phones.map(p => p.number).join(';');
      return [
        c.firstName || '',
        c.lastName || '',
        c.email || '',
        phones,
        (c.notes || '').replace(/,/g, ' ') // Avoid CSV comma breaks
      ].join(',');
    });
    
    return [header.join(','), ...rows].join('\n');
  }

  async importContacts(userId, fileBuffer) {
    const csvString = fileBuffer.toString('utf-8');
    // Handle both \r\n (Windows) and \n (Unix) line endings
    const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
    
    // Skip header
    const dataLines = lines.slice(1);
    
    const contactsToInsert = dataLines.map(line => {
      const parts = line.split(',');
      const firstName = (parts[0] || '').trim();
      const lastName = (parts[1] || '').trim();
      const email = (parts[2] || '').trim();
      const phoneStrings = (parts[3] || '').split(';').filter(p => p.trim() !== '');
      const phones = phoneStrings.map(num => ({ label: 'mobile', number: num.trim() }));
      const notes = (parts.slice(4).join(',') || '').trim(); // rejoin in case notes had commas
      
      return {
        owner: userId,
        firstName,
        lastName,
        email,
        phones: phones.length > 0 ? phones : [{ label: 'mobile', number: 'N/A' }],
        notes
      };
    }).filter(c => c.firstName !== ''); // Only insert if they have at least a first name
    
    if (contactsToInsert.length > 0) {
      await Contact.insertMany(contactsToInsert);
    }
    
    return contactsToInsert.length;
  }
}

module.exports = new ContactService();
