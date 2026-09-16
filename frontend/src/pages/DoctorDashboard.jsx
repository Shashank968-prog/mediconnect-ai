import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [profileResponse, appointmentsResponse] =
          await Promise.all([
            api.get("/api/profile", { headers }),
            api.get("/api/appointments", { headers }),
          ]);

        if (profileResponse.data.role !== "doctor") {
          navigate("/dashboard");
          return;
        }

        setUser(profileResponse.data);
        setAppointments(appointmentsResponse.data);
      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
            "Unable to load your dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const updateAppointmentStatus = async (appointmentId, status) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setMessage("");

      const response = await api.patch(
        `/api/appointments/${appointmentId}/status`,
        {
          status: status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

      setMessage(`Appointment ${status} successfully.`);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Unable to update appointment status."
      );
    }
  };

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
            {user
              ? `Welcome, ${user.name}`
              : "Loading your dashboard..."}
          </h1>

          <p>
            Manage your patient appointments and healthcare activities.
          </p>

          {user && (
            <p>
              Email: {user.email} | Role: {user.role}
            </p>
          )}

          {message && <p>{message}</p>}
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </section>

      <section className="dashboard-card">
        <h2>Patient Appointments</h2>

        {loading && <p>Loading appointments...</p>}

        {!loading && !message && appointments.length === 0 && (
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
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        updateAppointmentStatus(
                          appointment.id,
                          "cancelled"
                        )
                      }
                    >
                      Cancel
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
                    >
                      Mark Completed
                    </button>

                    <button
                      onClick={() =>
                        updateAppointmentStatus(
                          appointment.id,
                          "cancelled"
                        )
                      }
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default DoctorDashboard;