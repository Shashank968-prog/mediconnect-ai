import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);

      if (response.data.role === "doctor") {
        const appointmentResponse = await api.get("/api/appointments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAppointments(appointmentResponse.data);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load dashboard.");
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.patch(
        `/api/appointments/${appointmentId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Appointment status updated successfully.");

      fetchDashboard();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.detail ||
          "Unable to update appointment status."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <section className="dashboard-header">
          <div>
            <p className="dashboard-tag">MEDICONNECT AI</p>

            <h1>Welcome, {user.name}</h1>

            <p>
              Manage your patient appointments and healthcare activities.
            </p>

            <p>
              Email: {user.email} | Role: {user.role}
            </p>
          </div>

          <button
            className="dashboard-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </section>

        <section className="dashboard-card">
          <h2>Patient Appointments</h2>

          {appointments.length === 0 ? (
            <p>You don't have any appointments yet.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div
                  className="appointment-card"
                  key={appointment.id}
                >
                  <div>
                    <h3>
                      Appointment #{appointment.id}
                    </h3>

                    <p>
                      <strong>Date:</strong>{" "}
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
                      <span className="appointment-status">
                        {appointment.status}
                      </span>
                    </p>
                  </div>

                  <div className="appointment-actions">
                    {appointment.status === "pending" && (
                      <>
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
                          Reject
                        </button>
                      </>
                    )}

                    {appointment.status === "approved" && (
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <p className="dashboard-message">
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;