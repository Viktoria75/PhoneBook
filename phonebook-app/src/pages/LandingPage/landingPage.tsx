import React from 'react';
import { useNavigate } from 'react-router-dom';
import './landingPage.css'; 

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const sampleContact = {
    name: "Ivan Ivanov",
    phone: "+359 888 123 456",
    email: "ivan.ivanov@email.com",
    address: "Sofia, Bulgaria",
    company: "Tech Solutions Ltd.",
  };

  const features = [
    { title: "Easy Management", desc: "Add, edit and delete contacts quickly.", icon: "👤" },
    { title: "Fast Search", desc: "Find anyone instantly by name or phone.", icon: "🔍" },
    { title: "Favorites", desc: "Quick access to your most important people.", icon: "⭐" },
    { title: "Responsive", desc: "Beautiful design for any device size.", icon: "📱" },
  ];

  return (
    <div className="page-container">
      <header className="header-section">
        <nav className="nav-container">
          <h2 className="logo">PhoneBook</h2>
          <button className="primary-button" style={{color: '#4f46e5'}} onClick={() => navigate('/login')}>Sign Up</button>
        </nav>

        <div className="hero-container">
          <div className="hero-text">
            <h1 className="title">Manage your contacts in one smart place</h1>
            <p className="subtitle">
              The modern way to organize your professional and personal network. 
              Simple, fast, and secure.
            </p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={() => navigate('/login')}>Try Free Demo</button>
              <button className="secondary-button" onClick={() => navigate('/login')}>Watch Video</button>
            </div>

          </div>

          <div className="contact-card">
            <h3 className="card-title">Sample Contact</h3>
            <div style={{ lineHeight: '2' }}>
              <p><strong>Name:</strong> {sampleContact.name}</p>
              <p><strong>Phone:</strong> {sampleContact.phone}</p>
              <p><strong>Email:</strong> {sampleContact.email}</p>
              <p><strong>Company:</strong> {sampleContact.company}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="features-section">
        <h2 style={{fontSize: '36px', fontWeight: 800}}>Why choose PhoneBook?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 style={{color: '#4f46e5', marginBottom: '10px'}}>{feature.title}</h3>
              <p style={{color: '#6b7280', margin: 0}}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} PhoneBook App. Built for Web Technologies Project.</p>
      </footer>
    </div>
  );
};

export default LandingPage;