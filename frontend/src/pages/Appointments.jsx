import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

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

        setAppointments(response.data);
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
    const token = localStorage.getItem("access_token");

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
        currentAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "cancelled" }
            : appointment
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

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-tag">MEDICONNECT AI</p>
          <h1>My Appointments</h1>
          <p>View and manage your healthcare appointments.</p>
        </div>

        <button
          className="logout-button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </section>

      <section className="dashboard-card">
        <h2>Appointment History</h2>

        {loading && <p>Loading appointments...</p>}

        {message && <p>{message}</p>}

        {!loading && appointments.length === 0 && (
          <p>You don't have any appointments yet.</p>
        )}

        {!loading && appointments.length > 0 && (
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div
                className="appointment-item"
                key={appointment.id}
              >
                <h3>Appointment #{appointment.id}</h3>

                <p>
                  <strong>Doctor:</strong>{" "}
                  {appointment.doctor_name}
                </p>

                <p>
                  <strong>Specialization:</strong>{" "}
                  {appointment.specialization}
                </p>

                <p>
                  <strong>Qualification:</strong>{" "}
                  {appointment.qualification}
                </p>

                <p>
                  <strong>Experience:</strong>{" "}
                  {appointment.experience_years} years
                </p>

                <p>
                  <strong>Date & Time:</strong>{" "}
                  {new Date(
                    appointment.appointment_date
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Reason:</strong>{" "}
                  {appointment.reason}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {appointment.status}
                </p>

                {appointment.status !== "cancelled" &&
                  appointment.status !== "completed" && (
                    <button
                      onClick={() =>
                        handleCancel(appointment.id)
                      }
                    >
                      Cancel Appointment
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Appointments;