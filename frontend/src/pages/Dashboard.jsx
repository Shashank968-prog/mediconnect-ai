import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [reason, setReason] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const profileResponse = await api.get("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(profileResponse.data);

      const doctorResponse = await api.get("/api/doctors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDoctors(doctorResponse.data);

      const appointmentResponse = await api.get("/api/appointments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAppointments(appointmentResponse.data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.detail ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();

    try {
      setMessage("");

      await api.post(
        "/api/appointments",
        {
          doctor_id: Number(selectedDoctor),
          appointment_date: appointmentDate,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Appointment booked successfully.");

      setSelectedDoctor("");
      setAppointmentDate("");
      setReason("");

      loadDashboard();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Unable to book appointment."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
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

            <h1>Welcome, {user?.name}</h1>

            <p>
              Manage your healthcare appointments and connect
              with doctors.
            </p>

            <p>
              Email: {user?.email} | Role: {user?.role}
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
          <h2>Book an Appointment</h2>

          <form
            className="auth-form"
            onSubmit={handleBookAppointment}
          >
            <div className="form-group">
              <label>Select Doctor</label>

              <select
                value={selectedDoctor}
                onChange={(event) =>
                  setSelectedDoctor(event.target.value)
                }
                required
              >
                <option value="">
                  Select a doctor
                </option>

                {doctors.map((doctor) => (
                  <option
                    key={doctor.id}
                    value={doctor.user_id}
                  >
                    Dr. {doctor.user?.name} -{" "}
                    {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Appointment Date & Time</label>

              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(event) =>
                  setAppointmentDate(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Reason for Consultation</label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Describe the reason for your appointment"
                rows="4"
                required
              />
            </div>

            <button
              className="auth-submit"
              type="submit"
            >
              Book Appointment
            </button>
          </form>

          {message && (
            <p className="dashboard-message">
              {message}
            </p>
          )}
        </section>

        <section className="dashboard-card">
          <h2>My Appointments</h2>

          {appointments.length === 0 ? (
            <p>You don't have any appointments yet.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div
                  className="appointment-card"
                  key={appointment.id}
                >
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
                    {appointment.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

export default Dashboard;