import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../components/ToastContext";
import ConfirmModal from "../../components/ConfirmModal";
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
  const { addToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{isOpen: boolean, contactId: string | null}>({isOpen: false, contactId: null});
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    notes: "",
  });
  const [formPhones, setFormPhones] = useState<{label: string, number: string}[]>([{ label: "mobile", number: "" }]);

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts(1);
  }, []);

  const fetchContacts = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await axios.get(`/api/contacts?page=${pageNum}&limit=50`, { headers: authHeaders() });
      const enriched = response.data.map((c: any, i: number) => enrichContact(c, i));
      
      if (pageNum === 1) {
        setContacts(enriched);
      } else {
        setContacts(prev => [...prev, ...enriched]);
      }
      
      setHasMore(enriched.length === 50);
      setPage(pageNum);
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

  const filteredContacts = contacts.filter((c) => {
    if (showFavoritesOnly && !c.isFavorite) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  const grouped = groupByLetter(filteredContacts);
  const sortedLetters = Object.keys(grouped).sort();

  // Modal handlers
  const handleAddContact = () => {
    setFormData({ firstName: "", lastName: "", email: "", address: "", notes: "" });
    setFormPhones([{ label: "mobile", number: "" }]);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormPhoneChange = (index: number, field: "label" | "number", value: string) => {
    const updated = [...formPhones];
    updated[index] = { ...updated[index], [field]: value };
    setFormPhones(updated);
  };

  const handleAddFormPhone = () => {
    setFormPhones([...formPhones, { label: "mobile", number: "" }]);
  };

  const handleRemoveFormPhone = (index: number) => {
    if (formPhones.length <= 1) return;
    setFormPhones(formPhones.filter((_, i) => i !== index));
  };

  const handleCreateContact = async () => {
    const validPhones = formPhones.filter(p => p.number.trim());
    if (!formData.firstName.trim() || validPhones.length === 0) {
      addToast("First name and at least one phone number are required.", "error");
      return;
    }

    try {
      await axios.post(
        "/api/contacts",
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phones: validPhones,
          email: formData.email.trim(),
          address: formData.address.trim() ? { street: formData.address.trim() } : undefined,
          notes: formData.notes.trim(),
        },
        { headers: authHeaders() }
      );
      setShowModal(false);
      setSearchQuery("");
      addToast("Contact created successfully", "success");
      fetchContacts(1);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to create contact.";
      addToast(msg, "error");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation(); // Don't navigate to contact info
    setDeleteConfirmInfo({ isOpen: true, contactId });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmInfo.contactId) return;

    try {
      await axios.delete(`/api/contacts/${deleteConfirmInfo.contactId}`, { headers: authHeaders() });
      addToast("Contact deleted", "success");
      fetchContacts(1);
    } catch (err) {
      addToast("Failed to delete contact.", "error");
    } finally {
      setDeleteConfirmInfo({ isOpen: false, contactId: null });
    }
  };

  const handleDeleteAll = async () => {
    try {
      await axios.delete('/api/contacts/all', { headers: authHeaders() });
      addToast("All contacts deleted", "success");
      setContacts([]);
    } catch (err) {
      addToast("Failed to delete all contacts.", "error");
    } finally {
      setIsDeleteAllOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/contacts/export', { 
        headers: authHeaders(),
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Exported contacts to CSV", "success");
    } catch (err) {
      addToast("Export failed", "error");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post('/api/contacts/import', formData, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      addToast("Contacts imported successfully", "success");
      fetchContacts(1);
    } catch (err) {
      addToast("Import failed", "error");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
          <button className="cl-retry-btn" onClick={() => fetchContacts(1)}>Retry</button>
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
          
          <div className="cl-action-buttons">
            <button className="cl-action-btn" onClick={handleExport} title="Export CSV">
              Export
            </button>
            <button className="cl-action-btn" onClick={() => fileInputRef.current?.click()} title="Import CSV">
              Import
            </button>
            <button 
              className="cl-action-btn cl-action-btn-danger" 
              onClick={() => setIsDeleteAllOpen(true)} 
              title="Delete All Contacts" 
            >
              Delete All
            </button>
            <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImport} />
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
  
        {/* Search Bar */}
        <div className="cl-search-wrap">
          <div className="cl-search-inner">
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
              autoComplete="off"
            />
            {searchQuery && (
              <button className="cl-search-x" onClick={() => setSearchQuery("")} aria-label="Clear">
                ×
              </button>
            )}
          </div>
          <button
            className={`cl-fav-toggle${showFavoritesOnly ? ' active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title={showFavoritesOnly ? "Show all contacts" : "Show favorites only"}
          >
            {showFavoritesOnly ? "⭐" : "☆"}
          </button>
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
                  <span className="cl-name">
                    {contact.isFavorite ? "⭐ " : ""}{contact.name}
                  </span>
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
                    onClick={(e) => handleDeleteClick(e, contact._id)}
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
        
        {hasMore && !searchQuery && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button 
              className="cl-retry-btn" 
              onClick={() => fetchContacts(page + 1)}
              style={{ padding: '10px 24px' }}
            >
              Load More
            </button>
          </div>
        )}
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
                  autoComplete="off"
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
                  autoComplete="off"
                />
              </div>

              <div className="cl-modal-form-group">
                <label className="cl-modal-label">Phone Numbers *</label>
                {formPhones.map((phone, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <select
                      className="cl-modal-input"
                      value={phone.label}
                      onChange={(e) => handleFormPhoneChange(i, "label", e.target.value)}
                      style={{ width: '110px', flex: 'none' }}
                    >
                      <option value="mobile">Mobile</option>
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="tel"
                      className="cl-modal-input"
                      placeholder="Enter phone number"
                      value={phone.number}
                      onChange={(e) => handleFormPhoneChange(i, "number", e.target.value)}
                      autoComplete="off"
                    />
                    {formPhones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFormPhone(i)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', fontWeight: '700', flex: 'none' }}
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddFormPhone}
                  style={{ background: 'none', border: '1px dashed #94a3b8', borderRadius: '8px', padding: '8px 16px', color: '#6366f1', fontWeight: '600', fontSize: '13px', cursor: 'pointer', width: '100%' }}
                >
                  + Add a number
                </button>
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
                  autoComplete="off"
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
                  autoComplete="off"
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

      <ConfirmModal 
        isOpen={deleteConfirmInfo.isOpen}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmInfo({isOpen: false, contactId: null})}
      />

      <ConfirmModal 
        isOpen={isDeleteAllOpen}
        title="Delete All Contacts"
        message={`Are you sure you want to delete all ${contacts.length} contacts? This action cannot be undone.`}
        onConfirm={handleDeleteAll}
        onCancel={() => setIsDeleteAllOpen(false)}
      />
    </div>
  );
};

export default ContactList;