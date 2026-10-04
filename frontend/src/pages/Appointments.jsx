import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAppointments = async () => {
      try {
        const response = await api.get("/api/appointments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAppointments(
          response.data.filter(
            (appointment) => appointment.status !== "cancelled"
          )
        );
      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
            "Unable to load your appointments."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [navigate]);

  const handleCancel = async (appointmentId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await api.patch(
        `/api/appointments/${appointmentId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAppointments((currentAppointments) =>
        currentAppointments.filter(
          (appointment) => appointment.id !== appointmentId
        )
      );

      setMessage("Appointment cancelled successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Unable to cancel the appointment."
      );
    }
  };

  const getStatusClass = (status) => {
    if (status === "confirmed") {
      return "status-confirmed";
    }

    if (status === "completed") {
      return "status-completed";
    }

    if (status === "cancelled") {
      return "status-cancelled";
    }

    return "status-pending";
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <main className="appointments-page">
      <section className="appointments-header">
        <div>
          <p className="dashboard-tag">MEDICONNECT AI</p>

          <h1>My Appointments</h1>

          <p>
            View and manage your healthcare appointments in one place.
          </p>
        </div>

        <button
          className="book-appointment-button"
          onClick={() => navigate("/book-appointment")}
        >
          + Book Appointment
        </button>
      </section>

      {message && (
        <div className="appointment-message">
          {message}
        </div>
      )}

      {loading && (
        <section className="appointments-state">
          <div className="loading-icon">⏳</div>

          <h2>Loading your appointments...</h2>

          <p>
            Please wait while we retrieve your appointment history.
          </p>
        </section>
      )}

      {!loading && appointments.length === 0 && (
        <section className="appointments-state">
          <div className="empty-icon">📅</div>

          <h2>No appointments yet</h2>

          <p>
            You haven't booked any appointments. Find a doctor and
            schedule your first appointment.
          </p>

          <button
            className="book-appointment-button"
            onClick={() => navigate("/book-appointment")}
          >
            Book Your First Appointment
          </button>
        </section>
      )}

      {!loading && appointments.length > 0 && (
        <section className="appointments-section">
          <div className="appointments-section-title">
            <div>
              <h2>Appointment History</h2>

              <p>{appointments.length} appointment(s)</p>
            </div>
          </div>

          <div className="appointments-grid">
            {appointments.map((appointment) => (
              <article
                className="appointment-card"
                key={appointment.id}
              >
                <div className="appointment-card-top">
                  <div className="doctor-avatar">
                    👨‍⚕️
                  </div>

                  <span
                    className={`appointment-status ${getStatusClass(
                      appointment.status
                    )}`}
                  >
                    {formatStatus(appointment.status)}
                  </span>
                </div>

                <div className="doctor-info">
                  <h3>{appointment.doctor_name}</h3>

                  <p className="specialization">
                    {appointment.specialization}
                  </p>
                </div>

                <div className="appointment-date-box">
                  <div>
                    <span className="detail-label">DATE</span>

                    <strong>
                      📅 {formatDate(appointment.appointment_date)}
                    </strong>
                  </div>

                  <div>
                    <span className="detail-label">TIME</span>

                    <strong>
                      🕐 {formatTime(appointment.appointment_date)}
                    </strong>
                  </div>
                </div>

                <div className="appointment-details">
                  <div className="detail-row">
                    <span>Qualification</span>

                    <strong>
                      {appointment.qualification}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Experience</span>

                    <strong>
                      {appointment.experience_years} years
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Reason</span>

                    <strong>
                      {appointment.reason}
                    </strong>
                  </div>
                </div>

                {appointment.status !== "completed" && (
                  <button
                    className="cancel-appointment-button"
                    onClick={() =>
                      handleCancel(appointment.id)
                    }
                  >
                    Cancel Appointment
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default Appointments;