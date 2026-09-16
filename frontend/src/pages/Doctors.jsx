import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Doctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDoctors = async () => {
      try {
        const response = await api.get("/api/doctors", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDoctors(response.data);
      } catch (error) {
        setMessage(
          error.response?.data?.detail || "Unable to load doctors."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [navigate]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-tag">MEDICONNECT AI</p>
          <h1>Find Doctors</h1>
          <p>Explore available doctors and their specializations.</p>
        </div>

        <button
          className="logout-button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </section>

      <section className="dashboard-card">
        <h2>Available Doctors</h2>

        {loading && <p>Loading doctors...</p>}

        {message && <p>{message}</p>}

        {!loading && !message && doctors.length === 0 && (
          <p>No doctors are available at the moment.</p>
        )}

        {!loading && doctors.length > 0 && (
          <div className="dashboard-grid">
            {doctors.map((doctor) => (
              <div className="dashboard-card" key={doctor.id}>
                <div className="dashboard-card-icon">👨‍⚕️</div>

                <h2>{doctor.name}</h2>

                <p>
                  <strong>Specialization:</strong>{" "}
                  {doctor.specialization}
                </p>

                <p>
                  <strong>Experience:</strong>{" "}
                  {doctor.experience_years} years
                </p>

                <button
  onClick={() =>
    navigate(`/book-appointment?doctor_id=${doctor.user_id}`)
  }
>
  Book Appointment
</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Doctors;