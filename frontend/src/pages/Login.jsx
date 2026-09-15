import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post("/api/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("access_token", response.data.access_token);

      setMessage("Login successful!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Login failed. Please try again."
      );
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-container">
        <div className="auth-info">
          <p className="auth-tag">WELCOME BACK</p>

          <h1>
            Your health journey
            <span> continues here.</span>
          </h1>

          <p>
            Sign in to manage appointments, connect with doctors, and access
            your personalized healthcare experience.
          </p>

          <div className="auth-highlight">
            <span>✚</span>
            <div>
              <strong>Trusted Healthcare Support</strong>
              <p>Simple, secure, and intelligent healthcare management.</p>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo">✚</div>
            <h2>Login to MediConnect AI</h2>
            <p>Enter your details to access your account.</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button className="auth-submit" type="submit">
              Login
            </button>
          </form>

          {message && (
            <p
              className={`auth-message ${
                message.includes("successful") ? "success-message" : ""
              }`}
            >
              {message}
            </p>
          )}

          <p className="auth-footer">
            Don't have an account?{" "}
            <a href="/register">Create an account</a>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;