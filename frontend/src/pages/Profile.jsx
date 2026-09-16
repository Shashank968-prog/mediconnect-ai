import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error) {
        setMessage(
          error.response?.data?.detail || "Unable to load profile."
        );
      }
    };

    fetchProfile();
  }, [navigate]);

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
        >
          Back to Dashboard
        </button>
      </section>

      <section className="dashboard-card">
        {user ? (
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
        ) : (
          <p>{message || "Loading profile..."}</p>
        )}
      </section>
    </main>
  );
}

export default Profile;