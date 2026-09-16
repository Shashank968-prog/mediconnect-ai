import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
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
        console.error(
          "Profile request failed:",
          error.response?.data || error.message
        );

        setMessage(
          error.response?.data?.detail || "Unable to load your profile."
        );
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-tag">MEDICONNECT AI</p>

          <h1>
            {user ? `Welcome, ${user.name}` : "Loading your dashboard..."}
          </h1>

          <p>
            Manage your healthcare activities and access intelligent healthcare
            services.
          </p>

          {user && (
            <p>
              Email: {user.email} | Role: {user.role}
            </p>
          )}

          {message && <p>{message}</p>}
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-icon">👤</div>
          <h2>My Profile</h2>
          <p>View and manage your personal information.</p>

          <button onClick={() => navigate("/profile")}>
            View Profile
          </button>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">📅</div>
          <h2>Appointments</h2>
          <p>Book, view, and manage healthcare appointments.</p>

          <button onClick={() => navigate("/appointments")}>
            View Appointments
          </button>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">👨‍⚕️</div>
          <h2>Find Doctors</h2>
          <p>Explore available doctors and their specializations.</p>

          <button onClick={() => navigate("/doctors")}>
            Find Doctors
          </button>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">🤖</div>
          <h2>AI Health Assistant</h2>
          <p>Ask healthcare-related questions using AI assistance.</p>

          <button onClick={() => navigate("/assistant")}>
            Open Assistant
          </button>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;