import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function DoctorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingAppointmentId, setUpdatingAppointmentId] =
    useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const [profileResponse, appointmentsResponse] =
        await Promise.all([
          api.get("/api/profile"),
          api.get("/api/appointments"),
        ]);

      if (profileResponse.data.role !== "doctor") {
        navigate("/dashboard");
        return;
      }

      if (!Array.isArray(appointmentsResponse.data)) {
        throw new Error(
          "Unexpected appointments response from server."
        );
      }

      setUser(profileResponse.data);
      setAppointments(appointmentsResponse.data);
    } catch (error) {
      console.error("Doctor dashboard loading error:", error);

      if (error.response?.status === 401) {
        return;
      }

      setUser(null);
      setAppointments([]);

      setError(
        error.response?.data?.detail ||
          error.message ||
          "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateAppointmentStatus = async (
    appointmentId,
    status
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setUpdatingAppointmentId(appointmentId);
      setMessage("");
      setError("");

      const response = await api.patch(
        `/api/appointments/${appointmentId}/status`,
        {
          status: status,
        }
      );

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                status: response.data.status,
              }
            : appointment
        )
      );

      setMessage(
        `Appointment ${status} successfully.`
      );
    } catch (error) {
      console.error(
        "Appointment status update error:",
        error
      );

      if (error.response?.status === 401) {
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to update appointment status. Please try again."
      );
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-tag">
            MEDICONNECT AI
          </p>

          <h1>
            {loading
              ? "Loading your dashboard..."
              : user
                ? `Welcome, ${user.name}`
                : "Doctor Dashboard"}
          </h1>

          <p>
            Manage your patient appointments and healthcare
            activities.
          </p>

          {user && (
            <p>
              Email: {user.email} | Role: {user.role}
            </p>
          )}
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
          disabled={loading}
        >
          Logout
        </button>
      </section>

      {loading && (
        <section className="dashboard-card">
          <div className="appointments-state">
            <div className="loading-icon">⏳</div>

            <h2>Loading appointments...</h2>

            <p>
              Please wait while we retrieve your patient
              appointments.
            </p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="dashboard-card">
          <div className="appointments-state">
            <div className="empty-icon">⚠️</div>

            <h2>Unable to load dashboard</h2>

            <p>{error}</p>

            <button
              className="book-appointment-button"
              onClick={fetchData}
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {!loading && !error && (
        <section className="dashboard-card">
          <h2>Patient Appointments</h2>

          {message && (
            <p className="dashboard-message">
              {message}
            </p>
          )}

          {appointments.length === 0 && (
            <p>
              You don't have any appointments yet.
            </p>
          )}

          {appointments.length > 0 && (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div
                  className="appointment-item"
                  key={appointment.id}
                >
                  <h3>
                    Appointment #{appointment.id}
                  </h3>

                  <p>
                    <strong>Patient ID:</strong>{" "}
                    {appointment.patient_id}
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

                  {appointment.status === "pending" && (
                    <div>
                      <button
                        onClick={() =>
                          updateAppointmentStatus(
                            appointment.id,
                            "approved"
                          )
                        }
                        disabled={
                          updatingAppointmentId ===
                          appointment.id
                        }
                      >
                        {updatingAppointmentId ===
                        appointment.id
                          ? "Updating..."
                          : "Approve"}
                      </button>

                      <button
                        onClick={() =>
                          updateAppointmentStatus(
                            appointment.id,
                            "cancelled"
                          )
                        }
                        disabled={
                          updatingAppointmentId ===
                          appointment.id
                        }
                      >
                        {updatingAppointmentId ===
                        appointment.id
                          ? "Updating..."
                          : "Cancel"}
                      </button>
                    </div>
                  )}

                  {appointment.status === "approved" && (
                    <div>
                      <button
                        onClick={() =>
                          updateAppointmentStatus(
                            appointment.id,
                            "completed"
                          )
                        }
                        disabled={
                          updatingAppointmentId ===
                          appointment.id
                        }
                      >
                        {updatingAppointmentId ===
                        appointment.id
                          ? "Updating..."
                          : "Mark Completed"}
                      </button>

                      <button
                        onClick={() =>
                          updateAppointmentStatus(
                            appointment.id,
                            "cancelled"
                          )
                        }
                        disabled={
                          updatingAppointmentId ===
                          appointment.id
                        }
                      >
                        {updatingAppointmentId ===
                        appointment.id
                          ? "Updating..."
                          : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default DoctorDashboard;