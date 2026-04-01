import { useState } from "react";
import "./LoginRegister.css";

type Props = {
  onLogin: () => void;
};

function LoginRegister({ onLogin }: Props) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      <div className="auth-box">
        
        <p className="app-title">Phone Book</p>

        <h2>{isLogin ? "Login" : "Register"}</h2>

        {!isLogin && (
          <input type="text" placeholder="Phone number" />
        )}

        <input type="email" placeholder="Email" />

        <div className="password-field">
          <input type="password" placeholder="Password" />
          <span className="eye">👁</span>
        </div>

        {!isLogin && (
          <input type="password" placeholder="Confirm Password" />
        )}

        {isLogin && (
          <label className="stay-signed">
            <input type="checkbox" />
            Stay signed in
          </label>
        )}

        {isLogin && (
          <p className="forgot">Forgot password?</p>
        )}

        <button className="login-btn" onClick={onLogin}>
          {isLogin ? "Login" : "Register"}
        </button>

        <p className="switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Register" : " Login"}
          </span>
        </p>

      </div>
    </div>
  );
}

export default LoginRegister;