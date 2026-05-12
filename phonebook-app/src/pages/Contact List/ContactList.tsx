import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ContactList.css";

interface Phone {
  label: string;
  number: string;
}

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  phones: Phone[];
  email: string;
  name: string;
  phone: string;
  avatarColor: string;
  initials: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  notes?: string;
  photoUrl?: string;
  isFavorite?: boolean;
}

// Palette of gradients for avatars
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#fccb90,#d57eeb)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#30cfd0,#667eea)",
  "linear-gradient(135deg,#96fbc4,#f9f586)",
  "linear-gradient(135deg,#fddb92,#d1fdff)",
  "linear-gradient(135deg,#e0c3fc,#8ec5fc)",
  "linear-gradient(135deg,#84fab0,#8fd3f4)",
];

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function enrichContact(contact: any, index: number): Contact {
  return {
    ...contact,
    name: `${contact.firstName} ${contact.lastName}`,
    phone: contact.phones && contact.phones.length > 0 ? contact.phones[0].number : "",
    avatarColor: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
    initials: `${(contact.firstName || "?")[0]}${(contact.lastName || "?")[0]}`.toUpperCase(),
  };
}

function groupByLetter(list: Contact[]): Record<string, Contact[]> {
  return list.reduce((acc, c) => {
    const l = c.name[0].toUpperCase();
    if (!acc[l]) acc[l] = [];
    acc[l].push(c);
    return acc;
  }, {} as Record<string, Contact[]>);
}

const ContactList: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/contacts", { headers: authHeaders() });
      const enriched = response.data.map((c: any, i: number) => enrichContact(c, i));
      setContacts(enriched);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  const grouped = groupByLetter(contacts);
  const sortedLetters = Object.keys(grouped).sort();

  // Modal handlers
  const handleAddContact = () => {
    setFormData({ firstName: "", lastName: "", phone: "", email: "", address: "", notes: "" });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateContact = async () => {
    if (!formData.firstName.trim() || !formData.phone.trim()) {
      alert("First name and phone number are required.");
      return;
    }

    try {
      await axios.post(
        "/api/contacts",
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || " ",
          phones: [{ label: "mobile", number: formData.phone.trim() }],
          email: formData.email.trim(),
          address: formData.address.trim() ? { street: formData.address.trim() } : undefined,
          notes: formData.notes.trim(),
        },
        { headers: authHeaders() }
      );
      setShowModal(false);
      fetchContacts(); // Refresh the list
    } catch (err) {
      alert("Failed to create contact. Please try again.");
    }
  };

  const handleDeleteContact = async (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation(); // Don't navigate to contact info
    if (!window.confirm("Are you sure you want to delete this contact?")) return;

    try {
      await axios.delete(`/api/contacts/${contactId}`, { headers: authHeaders() });
      fetchContacts();
    } catch (err) {
      alert("Failed to delete contact.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="cl-page">
        <div className="cl-loading">
          <div className="cl-spinner"></div>
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cl-page">
        <div className="cl-loading">
          <p>{error}</p>
          <button className="cl-retry-btn" onClick={fetchContacts}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cl-page">

      {/* ── Header ── */}
      <header className="cl-header">
        <div className="cl-header-inner">
          <div className="cl-title-block">
            <span className="cl-label">Phonebook</span>
            <h1 className="cl-title">Contacts</h1>
          </div>
          <button className="cl-add-btn" onClick={handleAddContact} title="Add Contact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <div className="cl-pill">{contacts.length}</div>
          <button className="cl-logout-btn" onClick={handleLogout} title="Log Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
  
        {/* Search Bar - No functionality for now */}
        <div className="cl-search-wrap">
          <svg className="cl-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="cl-search"
            type="text"
            placeholder="Search by name, phone, or email…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="cl-search-x" onClick={() => setSearchQuery("")} aria-label="Clear">
              ×
            </button>
          )}
        </div>

      </header>

      {/* ── List ── */}
      <main className="cl-main">
        {contacts.length === 0 && (
          <div className="cl-empty">
            <p>No contacts yet. Add one!</p>
          </div>
        )}
        {sortedLetters.map((letter, li) => (
          <section key={letter} className="cl-group" style={{ "--li": li } as React.CSSProperties}>
            <div className="cl-letter">{letter}</div>
            {grouped[letter].map((contact, ci) => (
              <div
                key={contact._id}
                className="cl-row"
                style={{ "--ci": ci, "--li": li } as React.CSSProperties}
                onClick={() => navigate(`/contacts/${contact._id}`)}
              >
                <div className="cl-avatar" style={{ background: contact.avatarColor }}>
                  {contact.photoUrl ? (
                    <img src={`http://localhost:5000${contact.photoUrl}`} alt="" className="cl-avatar-img" />
                  ) : (
                    <span className="cl-initials">{contact.initials}</span>
                  )}
                </div>

                <div className="cl-info">
                  <span className="cl-name">{contact.name}</span>
                  <span className="cl-phone">{contact.phone}</span>
                </div>

                <div className="cl-actions">
                  <button className="cl-btn cl-btn-call" title="Call">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                    </svg>
                  </button>
                  <button
                    className="cl-btn cl-btn-del"
                    title="Delete"
                    onClick={(e) => handleDeleteContact(e, contact._id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>

      {/* Add Contact Modal */}
      {showModal && (
        <>
          <div className="cl-modal-overlay" onClick={handleCloseModal}></div>
          <div className="cl-modal">
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">Add New Contact</h2>
              <button className="cl-modal-close" onClick={handleCloseModal} title="Close">
                ×
              </button>
            </div>

            <div className="cl-modal-content">
              <div className="cl-modal-form-group">
                <label className="cl-modal-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  className="cl-modal-input"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleFormChange}
                />
              </div>

              <div className="cl-modal-form-group">
                <label className="cl-modal-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="cl-modal-input"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleFormChange}
                />
              </div>

              <div className="cl-modal-form-group">
                <label className="cl-modal-label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  className="cl-modal-input"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
              </div>

              <div className="cl-modal-form-group">
                <label className="cl-modal-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="cl-modal-input"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleFormChange}
                />
              </div>

              <div className="cl-modal-form-group">
                <label className="cl-modal-label">Address</label>
                <input
                  type="text"
                  name="address"
                  className="cl-modal-input"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleFormChange}
                />
              </div>

              <div className="cl-modal-form-group">
                <label className="cl-modal-label">Notes</label>
                <textarea
                  name="notes"
                  className="cl-modal-textarea"
                  placeholder="Enter notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="cl-modal-footer">
              <button className="cl-modal-cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="cl-modal-create-btn" onClick={handleCreateContact}>
                Create Contact
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactList;