import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Doctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view doctors.");
        return;
      }

      const response = await api.get("/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Doctors API response:", response.data);

      if (Array.isArray(response.data)) {
        setDoctors(response.data);
      } else {
        setDoctors([]);
        setError("Unexpected doctors response from server.");
      }
    } catch (error) {
      console.error("Doctors loading error:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to load doctors."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleBookAppointment = (doctor) => {
    navigate("/book-appointment", {
      state: {
        doctorId: doctor.id,
        doctorName: doctor.user?.name,
        specialization: doctor.specialization,
      },
    });
  };

  return (
    <main className="dashboard-page">
      <div className="doctors-container">
        <section className="doctors-hero">
          <div className="doctors-hero-icon">
            🩺
          </div>

          <div>
            <p className="dashboard-tag">
              MEDICONNECT AI
            </p>

            <h1>Find a Doctor</h1>

            <p>
              Browse available healthcare professionals
              and book an appointment.
            </p>
          </div>
        </section>

        <section className="doctors-section">
          <div className="doctors-section-header">
            <div>
              <h2>Available Doctors</h2>

              <p>
                {doctors.length} doctor
                {doctors.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {loading && (
            <div className="doctors-state">
              <div className="doctors-state-icon">
                ⏳
              </div>

              <h3>Loading doctors...</h3>

              <p>
                Please wait while we retrieve the
                available doctors.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="doctors-state doctors-error">
              <div className="doctors-state-icon">
                ⚠
              </div>

              <h3>Unable to load doctors</h3>

              <p>{error}</p>

              <button
                type="button"
                className="doctors-retry-button"
                onClick={loadDoctors}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            doctors.length === 0 && (
              <div className="doctors-state">
                <div className="doctors-state-icon">
                  🩺
                </div>

                <h3>No doctors available</h3>

                <p>
                  There are currently no verified
                  doctors available.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            doctors.length > 0 && (
              <div className="doctors-grid">
                {doctors.map((doctor) => (
                  <article
                    className="doctor-card"
                    key={doctor.id}
                  >
                    <div className="doctor-card-top">
                      <div className="doctor-avatar">
                        {doctor.user?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "D"}
                      </div>

                      <div>
                        <h3>
                          {doctor.user?.name ||
                            "Doctor"}
                        </h3>

                        <p className="doctor-specialization">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>

                    <div className="doctor-details">
                      <div className="doctor-detail-row">
                        <span>
                          Qualification
                        </span>

                        <strong>
                          {doctor.qualification ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div className="doctor-detail-row">
                        <span>
                          Experience
                        </span>

                        <strong>
                          {doctor.experience} years
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="doctor-book-button"
                      onClick={() =>
                        handleBookAppointment(doctor)
                      }
                    >
                      Book Appointment
                    </button>
                  </article>
                ))}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}

export default Doctors;