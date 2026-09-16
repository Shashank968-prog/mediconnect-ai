import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const doctorId = params.get("doctor_id");

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!doctorId) {
      setMessage("Doctor information is missing.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

      await api.post(
        "/api/appointments",
        {
          doctor_id: Number(doctorId),
          appointment_date: appointmentDateTime,
          reason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Appointment booked successfully.");

      setTimeout(() => {
        navigate("/appointments");
      }, 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Unable to book the appointment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-tag">MEDICONNECT AI</p>
          <h1>Book Appointment</h1>
          <p>Schedule an appointment with your selected doctor.</p>
        </div>

        <button
          className="logout-button"
          onClick={() => navigate("/doctors")}
        >
          Back to Doctors
        </button>
      </section>

      <section className="dashboard-card">
        <h2>Appointment Details</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Doctor ID</label>

            <input
              type="text"
              value={doctorId || ""}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Appointment Date</label>

            <input
              type="date"
              value={appointmentDate}
              onChange={(event) =>
                setAppointmentDate(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Appointment Time</label>

            <input
              type="time"
              value={appointmentTime}
              onChange={(event) =>
                setAppointmentTime(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Reason for Visit</label>

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Enter the reason for your appointment"
              rows="4"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Booking..." : "Book Appointment"}
          </button>

          {message && <p>{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default BookAppointment;