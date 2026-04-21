const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  label: {
    type: String,
    enum: ['mobile', 'home', 'work', 'other'],
    default: 'mobile',
  },
  number: {
    type: String,
    required: true,
  },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  street:     { type: String, default: '' },
  city:       { type: String, default: '' },
  country:    { type: String, default: '' },
  postalCode: { type: String, default: '' },
}, { _id: false });

const contactSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  phones: {
    type: [phoneSchema],
    validate: {
      validator: (arr) => arr.length >= 1,
      message: 'At least one phone number is required',
    },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  address: {
    type: addressSchema,
    default: () => ({}),
  },
  notes: {
    type: String,
    default: '',
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  photoUrl: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,  // auto createdAt & updatedAt
});

// Text index for predictive search
contactSchema.index(
  { firstName: 'text', lastName: 'text', notes: 'text' },
  { name: 'search_index' }
);

// Compound index: fast lookup for a user's contacts sorted by last name
contactSchema.index({ owner: 1, lastName: 1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Include virtuals in JSON
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contact', contactSchema);
