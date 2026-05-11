import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ContactInfo.css";

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  photoUrl?: string;
  avatarColor: string;
  initials: string;
}

// Mock contacts data (same as in ContactList)
const contacts: Contact[] = [
  { id: 1, name: "Alice Pemberton", phone: "+1 (555) 201-4892", email: "alice@example.com", address: "123 Main St", notes: "Best friend", avatarColor: "linear-gradient(135deg,#f093fb,#f5576c)", initials: "AP" },
  { id: 2, name: "Ben Hargrove", phone: "+1 (555) 334-7761", email: "ben@example.com", address: "456 Oak Ave", notes: "College buddy", avatarColor: "linear-gradient(135deg,#4facfe,#00f2fe)", initials: "BH" },
  { id: 3, name: "Clara Voss", phone: "+1 (555) 498-3210", email: "clara@example.com", address: "789 Pine Rd", notes: "Colleague", avatarColor: "linear-gradient(135deg,#43e97b,#38f9d7)", initials: "CV" },
  { id: 4, name: "Daniel Mercer", phone: "+1 (555) 112-6530", email: "daniel@example.com", address: "321 Elm St", notes: "", avatarColor: "linear-gradient(135deg,#fa709a,#fee140)", initials: "DM" },
  { id: 5, name: "Elena Russo", phone: "+1 (555) 778-9043", email: "elena@example.com", address: "654 Maple Dr", notes: "Sister", avatarColor: "linear-gradient(135deg,#a18cd1,#fbc2eb)", initials: "ER" },
  { id: 6, name: "Finn O'Sullivan", phone: "+1 (555) 663-2187", email: "finn@example.com", address: "987 Birch Ln", notes: "Mentor", avatarColor: "linear-gradient(135deg,#fccb90,#d57eeb)", initials: "FO" },
  { id: 7, name: "Grace Nakamura", phone: "+1 (555) 549-8820", email: "grace@example.com", address: "111 Cedar Way", notes: "Team lead", avatarColor: "linear-gradient(135deg,#f7971e,#ffd200)", initials: "GN" },
  { id: 8, name: "Hugo Castillo", phone: "+1 (555) 430-1174", email: "hugo@example.com", address: "222 Spruce St", notes: "", avatarColor: "linear-gradient(135deg,#30cfd0,#667eea)", initials: "HC" },
  { id: 9, name: "Isla Thornton", phone: "+1 (555) 227-5563", email: "isla@example.com", address: "333 Ash Ct", notes: "Friend", avatarColor: "linear-gradient(135deg,#96fbc4,#f9f586)", initials: "IT" },
  { id: 10, name: "James Bellamy", phone: "+1 (555) 881-3397", email: "james@example.com", address: "444 Walnut Ave", notes: "Work contact", avatarColor: "linear-gradient(135deg,#fddb92,#d1fdff)", initials: "JB" },
  { id: 11, name: "Kira Fontaine", phone: "+1 (555) 362-7748", email: "kira@example.com", address: "555 Cherry Ln", notes: "", avatarColor: "linear-gradient(135deg,#e0c3fc,#8ec5fc)", initials: "KF" },
  { id: 12, name: "Luca Ferretti", phone: "+1 (555) 514-0029", email: "luca@example.com", address: "666 Ash Rd", notes: "Italian colleague", avatarColor: "linear-gradient(135deg,#84fab0,#8fd3f4)", initials: "LF" },
];

const ContactInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [contact, setContact] = useState<Contact | null>(
    contacts.find(c => c.id === parseInt(id || "")) || null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Contact | null>(contact);

  if (!contact) {
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

  const handleEditStart = () => {
    setEditForm(contact);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditForm(contact);
    setIsEditing(false);
  };

  const handleEditSave = () => {
    if (editForm) {
      setContact(editForm);
      setIsEditing(false);
    }
  };

  const handleEditChange = (field: keyof Contact, value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`http://localhost:5000/api/contacts/${contact.id}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const data = await response.json();
      
      // Update local contact state with the photo URL
      setContact({
        ...contact,
        photoUrl: data.photoUrl,
      });

      setUploadSuccess("Photo uploaded successfully!");
      setTimeout(() => setUploadSuccess(""), 3000);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Error uploading photo");
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

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
          <h1 className="ci-title">{contact.name}</h1>
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
                  alt={contact.name} 
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
            {isEditing && editForm ? (
              <div className="ci-edit-form">
                <div className="ci-form-group">
                  <label className="ci-form-label">Name</label>
                  <input
                    type="text"
                    className="ci-form-input"
                    value={editForm.name}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Phone</label>
                  <input
                    type="tel"
                    className="ci-form-input"
                    value={editForm.phone}
                    onChange={(e) => handleEditChange("phone", e.target.value)}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Email</label>
                  <input
                    type="email"
                    className="ci-form-input"
                    value={editForm.email || ""}
                    onChange={(e) => handleEditChange("email", e.target.value)}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Address</label>
                  <input
                    type="text"
                    className="ci-form-input"
                    value={editForm.address || ""}
                    onChange={(e) => handleEditChange("address", e.target.value)}
                  />
                </div>

                <div className="ci-form-group">
                  <label className="ci-form-label">Notes</label>
                  <textarea
                    className="ci-form-textarea"
                    value={editForm.notes || ""}
                    onChange={(e) => handleEditChange("notes", e.target.value)}
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
                <div className="ci-detail-group">
                  <label className="ci-detail-label">Phone</label>
                  <p className="ci-detail-value">{contact.phone}</p>
                </div>

                {contact.email && (
                  <div className="ci-detail-group">
                    <label className="ci-detail-label">Email</label>
                    <p className="ci-detail-value">{contact.email}</p>
                  </div>
                )}

                {contact.address && (
                  <div className="ci-detail-group">
                    <label className="ci-detail-label">Address</label>
                    <p className="ci-detail-value">{contact.address}</p>
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactInfo;
