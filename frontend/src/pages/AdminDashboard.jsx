import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingDoctor, setProcessingDoctor] = useState(null);

  const loadPendingDoctors = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await api.get(
        "/api/admin/doctors/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDoctors(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Unable to load pending doctors."
      );
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchAdminData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const profileResponse = await api.get("/api/profile", {
          headers,
        });

        if (profileResponse.data.role !== "admin") {
          navigate("/dashboard");
          return;
        }

        setUser(profileResponse.data);

        const doctorsResponse = await api.get(
          "/api/admin/doctors/pending",
          {
            headers,
          }
        );

        setDoctors(doctorsResponse.data);
      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
            "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleVerification = async (
    doctorProfileId,
    status
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setProcessingDoctor(doctorProfileId);
      setMessage("");

      await api.patch(
        `/api/admin/doctors/${doctorProfileId}/verify`,
        {
          verification_status: status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDoctors((currentDoctors) =>
        currentDoctors.filter(
          (doctor) => doctor.id !== doctorProfileId
        )
      );

      setMessage(
        `Doctor ${status} successfully.`
      );
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          `Unable to ${status} doctor.`
      );
    } finally {
      setProcessingDoctor(null);
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
          <p>Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <section className="dashboard-header">
          <div>
            <p className="dashboard-tag">
              MEDICONNECT AI
            </p>

            <h1>
              Welcome, {user?.name}
            </h1>

            <p>
              Manage doctor verification and healthcare
              administration.
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
          <h2>Pending Doctor Applications</h2>

          {message && (
            <p className="dashboard-message">
              {message}
            </p>
          )}

          {doctors.length === 0 ? (
            <p>
              There are no pending doctor applications.
            </p>
          ) : (
            <div className="appointments-list">
              {doctors.map((doctor) => (
                <div
                  className="appointment-card"
                  key={doctor.id}
                >
                  <h3>
                    Dr. {doctor.user?.name}
                  </h3>

                  <p>
                    <strong>Email:</strong>{" "}
                    {doctor.user?.email}
                  </p>

                  <p>
                    <strong>Specialization:</strong>{" "}
                    {doctor.specialization}
                  </p>

                  <p>
                    <strong>Qualification:</strong>{" "}
                    {doctor.qualification}
                  </p>

                  <p>
                    <strong>Experience:</strong>{" "}
                    {doctor.experience} years
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    Pending
                  </p>

                  <div>
                    <button
                      onClick={() =>
                        handleVerification(
                          doctor.id,
                          "approved"
                        )
                      }
                      disabled={
                        processingDoctor === doctor.id
                      }
                    >
                      {processingDoctor === doctor.id
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    <button
                      onClick={() =>
                        handleVerification(
                          doctor.id,
                          "rejected"
                        )
                      }
                      disabled={
                        processingDoctor === doctor.id
                      }
                    >
                      {processingDoctor === doctor.id
                        ? "Processing..."
                        : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;