import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginRegister.css";

type Props = {
  onLogin: () => void;
};

function LoginRegister({ onLogin }: Props) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPasswordMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isLogin) {
      // ── Login ──
      if (!email.trim() || !password.trim()) {
        setErrorMessage("Please enter both email and password.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await axios.post("/api/auth/login", {
          email: email.trim(),
          password: password.trim(),
        });

        localStorage.setItem("token", res.data.token);
        onLogin();
      } catch (err: any) {
        const msg = err.response?.data?.message || "Login failed. Please try again.";
        setErrorMessage(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── Register ──
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!isPasswordMatch) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/auth/register", {
        username: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });

      localStorage.setItem("token", res.data.token);
      onLogin();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-box forgot-box">
          <p className="app-name">Phone Book</p>
          <h1 className="forgot-title">FORGOTTEN YOUR PASSWORD?</h1>

          <p className="forgot-description">
            Please enter your e-mail and we will send you a link to reset your password.
          </p>

          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="E-mail"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <button type="submit">SEND</button>
          </form>

          <p className="back-to-login" onClick={() => setShowForgotPassword(false)}>
            Back to Login
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <p className="app-name">Phone Book</p>

        <h1>{isLogin ? "Login" : "Register"}</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="password-wrapper">
            <input
              className="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {isLogin && (
            <label className="stay-signed-in">
              <input
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
              />
              <span>Stay signed in</span>
            </label>
          )}

          {!isLogin && (
            <>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {!isPasswordMatch && confirmPassword && (
                <p className="error-text">Passwords do not match</p>
              )}
            </>
          )}

          {errorMessage && <p className="error-text">{errorMessage}</p>}

          <button type="submit" disabled={(!isLogin && !isPasswordMatch) || isSubmitting}>
            {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        {isLogin && (
          <p
            className="forgot-password"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot password?
          </p>
        )}

        <p className="switch-text">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage("");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {isLogin ? " Register" : " Login"}
          </span>
        </p>

        <p className="switch-text" style={{ marginTop: '8px' }}>
          <span onClick={() => navigate("/")} style={{ color: '#6366f1', cursor: 'pointer' }}>
            ← Back to Home
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginRegister;