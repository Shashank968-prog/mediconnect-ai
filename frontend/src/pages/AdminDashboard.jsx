import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingDoctor, setProcessingDoctor] = useState(null);

  const loadPendingDoctors = async () => {
    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await api.get(
        "/api/admin/doctors/pending"
      );

      if (!Array.isArray(response.data)) {
        throw new Error(
          "Unexpected doctor response from server."
        );
      }

      setDoctors(response.data);
    } catch (error) {
      console.error(
        "Pending doctors loading error:",
        error
      );

      if (error.response?.status === 401) {
        return;
      }

      setDoctors([]);

      setError(
        error.response?.data?.detail ||
          error.message ||
          "Unable to load pending doctors. Please try again."
      );
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const profileResponse = await api.get(
        "/api/profile"
      );

      if (profileResponse.data.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setUser(profileResponse.data);

      const doctorsResponse = await api.get(
        "/api/admin/doctors/pending"
      );

      if (!Array.isArray(doctorsResponse.data)) {
        throw new Error(
          "Unexpected doctor response from server."
        );
      }

      setDoctors(doctorsResponse.data);
    } catch (error) {
      console.error(
        "Admin dashboard loading error:",
        error
      );

      if (error.response?.status === 401) {
        return;
      }

      setUser(null);
      setDoctors([]);

      setError(
        error.response?.data?.detail ||
          error.message ||
          "Unable to load admin dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

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
      setError("");

      await api.patch(
        `/api/admin/doctors/${doctorProfileId}/verify`,
        {
          verification_status: status,
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
      console.error(
        "Doctor verification error:",
        error
      );

      if (error.response?.status === 401) {
        return;
      }

      setError(
        error.response?.data?.detail ||
          `Unable to ${status} doctor. Please try again.`
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
          <section className="dashboard-card">
            <div className="appointments-state">
              <div className="loading-icon">⏳</div>

              <h2>Loading admin dashboard...</h2>

              <p>
                Please wait while we retrieve the
                pending doctor applications.
              </p>
            </div>
          </section>
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
            disabled={processingDoctor !== null}
          >
            Logout
          </button>
        </section>

        {error && (
          <section className="dashboard-card">
            <div className="appointments-state">
              <div className="empty-icon">⚠️</div>

              <h2>Unable to load admin dashboard</h2>

              <p>{error}</p>

              <button
                className="book-appointment-button"
                onClick={fetchAdminData}
                disabled={processingDoctor !== null}
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        {!error && (
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
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;