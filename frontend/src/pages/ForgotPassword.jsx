import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post(
        "/api/forgot-password",
        {
          email: email.trim(),
        }
      );

      setMessage(response.data.message);
      setOtpSent(true);
    } catch (error) {
      console.error("Send OTP error:", error);

      setMessage(
        error.response?.data?.detail ||
          error.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

    if (!passwordPattern.test(newPassword)) {
      setMessage(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await api.post(
        "/api/reset-password",
        {
          email: email.trim(),
          otp: otp.trim(),
          new_password: newPassword,
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Password reset error:", error);

      setMessage(
        error.response?.data?.detail ||
          error.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>Forgot Password</h1>

        {!otpSent ? (
          <>
            <p>
              Enter your registered email address to receive a password
              reset OTP.
            </p>

            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Sending OTP..."
                  : "Send OTP"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p>
              OTP has been sent to{" "}
              <strong>{email}</strong>.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>OTP</label>

                <input
                  type="text"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value)
                  }
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Enter new password"
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                  required
                />

                <small>
                  Password must contain:
                  <br />
                  • At least 8 characters
                  <br />
                  • One uppercase letter
                  <br />
                  • One lowercase letter
                  <br />
                  • One number
                  <br />
                  • One special character
                </small>
              </div>

              <div className="form-group">
                <label>
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Resetting Password..."
                  : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {message && <p>{message}</p>}

        <p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            Back to Login
          </button>
        </p>
      </section>
    </main>
  );
}

export default ForgotPassword;