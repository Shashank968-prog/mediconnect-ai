import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const queryDoctorId = params.get("doctor_id");

  const selectedDoctor = location.state || {};

  const doctorId =
    selectedDoctor.doctorUserId ||
    selectedDoctor.doctorId ||
    queryDoctorId;

  const doctorName =
    selectedDoctor.doctorName || "";

  const specialization =
    selectedDoctor.specialization || "";

  const [appointmentDate, setAppointmentDate] =
    useState("");

  const [appointmentTime, setAppointmentTime] =
    useState("");

  const [reason, setReason] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setMessage("");
    setError("");

    if (!doctorId) {
      setError("Doctor information is missing.");
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      setError("Please select an appointment date and time.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter the reason for your visit.");
      return;
    }

    try {
      setLoading(true);

      const appointmentDateTime =
        `${appointmentDate}T${appointmentTime}:00`;

      await api.post(
        "/api/appointments",
        {
          doctor_id: Number(doctorId),
          appointment_date: appointmentDateTime,
          reason: reason.trim(),
        }
      );

      setMessage("Appointment booked successfully.");

      setTimeout(() => {
        navigate("/appointments");
      }, 1000);
    } catch (error) {
      console.error("Appointment booking error:", error);

      if (error.response?.status === 401) {
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to book the appointment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-tag">
            MEDICONNECT AI
          </p>

          <h1>Book Appointment</h1>

          <p>
            Schedule an appointment with your selected
            doctor.
          </p>
        </div>

        <button
          className="logout-button"
          onClick={() => navigate("/doctors")}
          disabled={loading}
        >
          Back to Doctors
        </button>
      </section>

      <section className="dashboard-card">
        <h2>Appointment Details</h2>

        <form onSubmit={handleSubmit}>
          {doctorName && (
            <div className="form-group">
              <label htmlFor="doctor-name">
                Doctor
              </label>

              <input
                id="doctor-name"
                type="text"
                value={doctorName}
                readOnly
              />
            </div>
          )}

          {specialization && (
            <div className="form-group">
              <label htmlFor="doctor-specialization">
                Specialization
              </label>

              <input
                id="doctor-specialization"
                type="text"
                value={specialization}
                readOnly
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="appointment-date">
              Appointment Date
            </label>

            <input
              id="appointment-date"
              type="date"
              value={appointmentDate}
              onChange={(event) =>
                setAppointmentDate(event.target.value)
              }
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="appointment-time">
              Appointment Time
            </label>

            <input
              id="appointment-time"
              type="time"
              value={appointmentTime}
              onChange={(event) =>
                setAppointmentTime(event.target.value)
              }
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="appointment-reason">
              Reason for Visit
            </label>

            <textarea
              id="appointment-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="Enter the reason for your appointment"
              rows="4"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Booking..."
              : "Book Appointment"}
          </button>

          {message && (
            <p className="dashboard-message">
              {message}
            </p>
          )}

          {error && (
            <p className="dashboard-error">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default BookAppointment;