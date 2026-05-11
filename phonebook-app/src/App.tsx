import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage/landingPage";
import ContactList from "./pages/Contact List/ContactList";
import ContactInfo from "./pages/Contact Info/ContactInfo";
import LoginRegister from "./pages/LoginRegister/LoginRegister";

function LoginWrapper() {
  const navigate = useNavigate();
  return <LoginRegister onLogin={() => navigate('/contacts')} />;
}

//check if JWT token exists in localStorage
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/contacts" element={
          <ProtectedRoute>
            <ContactList />
          </ProtectedRoute>
        } />
        <Route path="/contacts/:id" element={
          <ProtectedRoute>
            <ContactInfo />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
