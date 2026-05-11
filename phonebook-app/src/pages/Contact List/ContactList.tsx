import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ContactList.css";

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  phones: { label: string; number: string }[];
  email: string;
  name: string;
  phone: string;
  avatarColor?: string;
  initials?: string;
  email?: string;
  address?: string;
  notes?: string;
}

const ContactList: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get('/api/contacts');
        const data = response.data;
        // Add avatarColor and initials
        const enrichedContacts = data.map((contact: any) => ({
          ...contact,
          name: `${contact.firstName} ${contact.lastName}`,
          phone: contact.phones.length > 0 ? contact.phones[0].number : '',
          avatarColor: "linear-gradient(135deg,#f093fb,#f5576c)", // Default color, can randomize
          initials: `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase(),
        }));
        setContacts(enrichedContacts);
      } catch (err) {
        setError('Failed to fetch contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  function groupByLetter(list: Contact[]): Record<string, Contact[]> {
    return list.reduce((acc, c) => {
      const l = c.name[0].toUpperCase();
      if (!acc[l]) acc[l] = [];
      acc[l].push(c);
      return acc;
    }, {} as Record<string, Contact[]>);
  }

  const grouped = groupByLetter(contacts);
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
                key={contact._id}
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
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                    </svg>
                  </button>
                  <button className="cl-btn cl-btn-msg" title="Message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
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