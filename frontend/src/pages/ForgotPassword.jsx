import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setResetToken("");

      const response = await api.post("/api/forgot-password", {
        email: email,
      });

      setMessage(response.data.message);
      setResetToken(response.data.token);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>Forgot Password</h1>

        <p>
          Enter your registered email address to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Request Password Reset"}
          </button>
        </form>

        {message && <p>{message}</p>}

        {resetToken && (
          <div>
            <p>Password reset token:</p>

            <textarea
              value={resetToken}
              readOnly
              rows="4"
            />

            <button
              onClick={() =>
                navigate(`/reset-password?token=${resetToken}`)
              }
            >
              Continue to Reset Password
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default ForgotPassword;