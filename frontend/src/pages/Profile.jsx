import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await api.get("/api/profile");

      if (!response.data) {
        throw new Error("Unable to retrieve profile information.");
      }

      setUser(response.data);
    } catch (error) {
      console.error("Profile loading error:", error);

      if (error.response?.status === 401) {
        return;
      }

      setUser(null);

      setMessage(
        error.response?.data?.detail ||
          error.message ||
          "Unable to load profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-tag">MEDICONNECT AI</p>
          <h1>My Profile</h1>
          <p>View your registered account information.</p>
        </div>

        <button
          className="logout-button"
          onClick={() => navigate("/dashboard")}
          disabled={loading}
        >
          Back to Dashboard
        </button>
      </section>

      <section className="dashboard-card">
        {loading && (
          <div className="appointments-state">
            <div className="loading-icon">⏳</div>

            <h2>Loading profile...</h2>

            <p>
              Please wait while we retrieve your profile information.
            </p>
          </div>
        )}

        {!loading && message && (
          <div className="appointments-state">
            <div className="empty-icon">⚠️</div>

            <h2>Unable to load profile</h2>

            <p>{message}</p>

            <button
              className="book-appointment-button"
              onClick={fetchProfile}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !message && user && (
          <>
            <h2>Personal Information</h2>

            <p>
              <strong>Name:</strong> {user.name}
            </p>

            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default Profile;