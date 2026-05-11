import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./ContactInfo.css";

interface Phone {
  label: string;
  number: string;
}

interface Address {
  street?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  phones: Phone[];
  email?: string;
  address?: Address;
  notes?: string;
  photoUrl?: string;
  isFavorite?: boolean;
  avatarColor: string;
  initials: string;
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#fccb90,#d57eeb)",
];

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatAddress(addr?: Address): string {
  if (!addr) return "";
  const parts = [addr.street, addr.city, addr.country, addr.postalCode].filter(Boolean);
  return parts.join(", ");
}

const ContactInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phones: [{ label: "mobile", number: "" }] as Phone[],
    email: "",
    address: { street: "", city: "", country: "" } as Address,
    notes: "",
  });

  // Fetch contact from API
  useEffect(() => {
    if (!id) return;
    const fetchContact = async () => {
      try {
        const res = await axios.get(`/api/contacts/${id}`, { headers: authHeaders() });
        const c = res.data;
        const enriched: Contact = {
          ...c,
          avatarColor: AVATAR_GRADIENTS[c.firstName.charCodeAt(0) % AVATAR_GRADIENTS.length],
          initials: `${(c.firstName || "?")[0]}${(c.lastName || "?")[0]}`.toUpperCase(),
        };
        setContact(enriched);
      } catch (err: any) {
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError("Contact not found");
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [id, navigate]);

  const handleEditStart = () => {
    if (!contact) return;
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phones: contact.phones.length > 0 ? [...contact.phones] : [{ label: "mobile", number: "" }],
      email: contact.email || "",
      address: {
        street: contact.address?.street || "",
        city: contact.address?.city || "",
        country: contact.address?.country || "",
      },
      notes: contact.notes || "",
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => setIsEditing(false);

  const handleEditSave = async () => {
    if (!contact) return;
    try {
      const res = await axios.put(`/api/contacts/${contact._id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phones: editForm.phones.filter(p => p.number.trim()),
        email: editForm.email,
        address: editForm.address,
        notes: editForm.notes,
      }, { headers: authHeaders() });

      const c = res.data;
      setContact({
        ...c,
        avatarColor: contact.avatarColor,
        initials: `${(c.firstName || "?")[0]}${(c.lastName || "?")[0]}`.toUpperCase(),
      });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save changes.");
    }
  };

  const handlePhoneChange = (index: number, field: "label" | "number", value: string) => {
    const updated = [...editForm.phones];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, phones: updated });
  };

  const handleAddPhone = () => {
    setEditForm({
      ...editForm,
      phones: [...editForm.phones, { label: "mobile", number: "" }],
    });
  };

  const handleRemovePhone = (index: number) => {
    if (editForm.phones.length <= 1) return;
    const updated = editForm.phones.filter((_, i) => i !== index);
    setEditForm({ ...editForm, phones: updated });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !contact) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await axios.post(`/api/contacts/${contact._id}/photo`, formData, {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      setContact({ ...contact, photoUrl: res.data.photoUrl });
      setUploadSuccess("Photo uploaded successfully!");
      setTimeout(() => setUploadSuccess(""), 3000);
    } catch (err) {
      setUploadError("Failed to upload photo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (!window.confirm(`Delete ${contact.firstName} ${contact.lastName}?`)) return;

    try {
      await axios.delete(`/api/contacts/${contact._id}`, { headers: authHeaders() });
      navigate("/contacts");
    } catch (err) {
      alert("Failed to delete contact.");
    }
  };

  if (loading) {
    return (
      <div className="ci-page">
        <div className="ci-not-found">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="ci-page">
        <div className="ci-not-found">
          <h2>Contact not found</h2>
          <button className="ci-back-btn" onClick={() => navigate("/contacts")}>
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;
  const addressStr = formatAddress(contact.address);

  return (
    <div className="ci-page">
      <header className="ci-header">
        <button className="ci-back-btn" onClick={() => navigate("/contacts")} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
        <div className="ci-title-block">
          <span className="ci-label">Contact</span>
          <h1 className="ci-title">{fullName}</h1>
        </div>
        {!isEditing && (
          <button className="ci-edit-btn" onClick={handleEditStart} title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}
      </header>

      <main className="ci-main">
        <div className="ci-card">
          <div className="ci-photo-section">
            {contact.photoUrl ? (
              <div className="ci-photo-container">
                <img
                  src={`http://localhost:5000${contact.photoUrl}`}
                  alt={fullName}
                  className="ci-photo"
                />
                <div className="ci-photo-overlay">
                  <label className="ci-photo-upload-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="ci-photo-placeholder">
                <div className="ci-avatar" style={{ background: contact.avatarColor }}>
                  <span className="ci-initials">{contact.initials}</span>
                </div>
                <div className="ci-upload-prompt">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Upload Photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
            )}

            {uploading && <div className="ci-upload-spinner">Uploading...</div>}
            {uploadError && <div className="ci-upload-error">{uploadError}</div>}
            {uploadSuccess && <div className="ci-upload-success">{uploadSuccess}</div>}
          </div>

          <div className="ci-details">
            {isEditing ? (
              <div className="ci-edit-form">
                <div className="ci-form-group">
                  <label className="ci-form-label">First Name</label>
                  <input
                    type="text"
                    className="ci-form-input"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Last Name</label>
                  <input
                    type="text"
                    className="ci-form-input"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  />
                </div>

                {/* Multiple phones */}
                <div className="ci-form-group">
                  <label className="ci-form-label">Phone Numbers</label>
                  {editForm.phones.map((phone, i) => (
                    <div key={i} className="ci-phone-row">
                      <select
                        className="ci-form-select"
                        value={phone.label}
                        onChange={(e) => handlePhoneChange(i, "label", e.target.value)}
                      >
                        <option value="mobile">Mobile</option>
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="tel"
                        className="ci-form-input"
                        value={phone.number}
                        onChange={(e) => handlePhoneChange(i, "number", e.target.value)}
                        placeholder="Phone number"
                      />
                      {editForm.phones.length > 1 && (
                        <button className="ci-remove-phone" onClick={() => handleRemovePhone(i)} title="Remove">×</button>
                      )}
                    </div>
                  ))}
                  <button className="ci-add-phone-btn" onClick={handleAddPhone}>+ Add Phone</button>
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Email</label>
                  <input
                    type="email"
                    className="ci-form-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Street</label>
                  <input
                    type="text"
                    className="ci-form-input"
                    value={editForm.address.street || ""}
                    onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, street: e.target.value } })}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">City</label>
                  <input
                    type="text"
                    className="ci-form-input"
                    value={editForm.address.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Country</label>
                  <input
                    type="text"
                    className="ci-form-input"
                    value={editForm.address.country || ""}
                    onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, country: e.target.value } })}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Notes</label>
                  <textarea
                    className="ci-form-textarea"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>

                <div className="ci-edit-buttons">
                  <button className="ci-save-btn" onClick={handleEditSave}>
                    Save Changes
                  </button>
                  <button className="ci-cancel-btn" onClick={handleEditCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Multiple phone numbers */}
                <div className="ci-detail-group">
                  <label className="ci-detail-label">Phone</label>
                  {contact.phones.map((p, i) => (
                    <div key={i} className="ci-phone-detail">
                      <span className="ci-phone-label-tag">{p.label}</span>
                      <p className="ci-detail-value">{p.number}</p>
                    </div>
                  ))}
                </div>

                {contact.email && (
                  <div className="ci-detail-group">
                    <label className="ci-detail-label">Email</label>
                    <p className="ci-detail-value">{contact.email}</p>
                  </div>
                )}

                {addressStr && (
                  <div className="ci-detail-group">
                    <label className="ci-detail-label">Address</label>
                    <p className="ci-detail-value">{addressStr}</p>
                  </div>
                )}

                {contact.notes && (
                  <div className="ci-detail-group">
                    <label className="ci-detail-label">Notes</label>
                    <p className="ci-detail-value">{contact.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="ci-actions">
            <button className="ci-action-btn ci-call-btn" title="Call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              Call
            </button>
            <button className="ci-action-btn ci-message-btn" title="Message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Message
            </button>
            <button className="ci-action-btn ci-email-btn" title="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M7 9l5 3.73 5-3.73"/>
              </svg>
              Email
            </button>
            <button className="ci-action-btn ci-delete-btn" title="Delete" onClick={handleDelete}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
              Delete Contact
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactInfo;
