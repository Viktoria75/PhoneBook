import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage/landingPage";
import ContactList from "./pages/Contact List/ContactList";
import LoginRegister from "./pages/LoginRegister/LoginRegister";

function LoginWrapper() {
  const navigate = useNavigate();
  return <LoginRegister onLogin={() => navigate('/contacts')} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/contacts" element={<ContactList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
