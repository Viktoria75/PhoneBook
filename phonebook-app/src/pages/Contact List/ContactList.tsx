import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ContactList.css";

interface Contact {
  id: number;
  name: string;
  phone: string;
  avatarColor?: string;
  initials?: string;
  email?: string;
  address?: string;
  notes?: string;
}

const contacts: Contact[] = [
  { id: 1,  name: "Alice Pemberton",   phone: "+1 (555) 201-4892", avatarColor: "linear-gradient(135deg,#f093fb,#f5576c)", initials: "AP" },
  { id: 2,  name: "Ben Hargrove",      phone: "+1 (555) 334-7761", avatarColor: "linear-gradient(135deg,#4facfe,#00f2fe)", initials: "BH" },
  { id: 3,  name: "Clara Voss",        phone: "+1 (555) 498-3210", avatarColor: "linear-gradient(135deg,#43e97b,#38f9d7)", initials: "CV" },
  { id: 4,  name: "Daniel Mercer",     phone: "+1 (555) 112-6530", avatarColor: "linear-gradient(135deg,#fa709a,#fee140)", initials: "DM" },
  { id: 5,  name: "Elena Russo",       phone: "+1 (555) 778-9043", avatarColor: "linear-gradient(135deg,#a18cd1,#fbc2eb)", initials: "ER" },
  { id: 6,  name: "Finn O'Sullivan",   phone: "+1 (555) 663-2187", avatarColor: "linear-gradient(135deg,#fccb90,#d57eeb)", initials: "FO" },
  { id: 7,  name: "Grace Nakamura",    phone: "+1 (555) 549-8820", avatarColor: "linear-gradient(135deg,#f7971e,#ffd200)", initials: "GN" },
  { id: 8,  name: "Hugo Castillo",     phone: "+1 (555) 430-1174", avatarColor: "linear-gradient(135deg,#30cfd0,#667eea)", initials: "HC" },
  { id: 9,  name: "Isla Thornton",     phone: "+1 (555) 227-5563", avatarColor: "linear-gradient(135deg,#96fbc4,#f9f586)", initials: "IT" },
  { id: 10, name: "James Bellamy",     phone: "+1 (555) 881-3397", avatarColor: "linear-gradient(135deg,#fddb92,#d1fdff)", initials: "JB" },
  { id: 11, name: "Kira Fontaine",     phone: "+1 (555) 362-7748", avatarColor: "linear-gradient(135deg,#e0c3fc,#8ec5fc)", initials: "KF" },
  { id: 12, name: "Luca Ferretti",     phone: "+1 (555) 514-0029", avatarColor: "linear-gradient(135deg,#84fab0,#8fd3f4)", initials: "LF" },
];

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
  const [contactsList, setContactsList] = useState(contacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const generateInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const generateAvatarColor = () => {
    const colors = [
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
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddContact = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateContact = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Name and phone are required!");
      return;
    }

    const newContact: Contact = {
      id: Math.max(...contactsList.map(c => c.id), 0) + 1,
      name: formData.name,
      phone: formData.phone,
      email: formData.email || "",
      address: formData.address || "",
      notes: formData.notes || "",
      initials: generateInitials(formData.name),
      avatarColor: generateAvatarColor(),
    };

    setContactsList([...contactsList, newContact]);
    handleCloseModal();
  };

  const grouped = groupByLetter(contactsList);
  const sortedLetters = Object.keys(grouped).sort();

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
          <div className="cl-pill">{contactsList.length}</div>
        </div>

        {/* Search */}
        <div className="cl-search-wrap">
          <svg className="cl-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="cl-search"
            type="text"
            placeholder="Search"
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
        {sortedLetters.map((letter, li) => (
          <section key={letter} className="cl-group" style={{ "--li": li } as React.CSSProperties}>
            <div className="cl-letter">{letter}</div>
            {grouped[letter].map((contact, ci) => (
              <div
                key={contact.id}
                className="cl-row"
                style={{ "--ci": ci, "--li": li } as React.CSSProperties}
                onClick={() => navigate(`/contacts/${contact.id}`)}
              >
                <div className="cl-avatar" style={{ background: contact.avatarColor }}>
                  <span className="cl-initials">{contact.initials}</span>
                </div>

                <div className="cl-info">
                  <span className="cl-name">{contact.name}</span>
                  <span className="cl-phone">{contact.phone}</span>
                </div>

                <div className="cl-actions">
                  <button className="cl-btn cl-btn-call" title="Call">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                    </svg>
                  </button>
                  <button className="cl-btn cl-btn-msg" title="Message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
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
                <label className="cl-modal-label">Name *</label>
                <input
                  type="text"
                  name="name"
                  className="cl-modal-input"
                  placeholder="Enter full name"
                  value={formData.name}
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