import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");

  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [consultationFee, setConsultationFee] = useState("");

  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await api.post("/api/register", {
        name: fullName,
        email,
        password,
        role,
        specialization: role === "doctor" ? specialization : null,
        qualification: role === "doctor" ? qualification : null,
        experience: role === "doctor" ? Number(experience) : null,
        license_number: role === "doctor" ? licenseNumber : null,
        consultation_fee:
          role === "doctor" ? Number(consultationFee) : null,
      });

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      const detail = error.response?.data?.detail;

      setMessage(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(", ")
          : detail || "Registration failed. Please try again."
      );
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-container">
        <div className="auth-info">
          <p className="auth-tag">JOIN MEDICONNECT AI</p>

          <h1>
            Better healthcare
            <span> starts with you.</span>
          </h1>

          <p>
            Create your account to book appointments, discover doctors, and
            explore intelligent healthcare assistance.
          </p>

          <div className="auth-benefits">
            <div>
              <span>✓</span>
              <p>Manage your healthcare appointments</p>
            </div>

            <div>
              <span>✓</span>
              <p>Connect with healthcare professionals</p>
            </div>

            <div>
              <span>✓</span>
              <p>Access AI-powered healthcare support</p>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo">✚</div>

            <h2>Create Your Account</h2>

            <p>Join MediConnect AI today.</p>
          </div>

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerEmail">Email Address</label>

              <input
                id="registerEmail"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerPassword">Password</label>

              <input
                id="registerPassword"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />

              <small>Password must contain at least 8 characters.</small>
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type</label>

              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {role === "doctor" && (
              <>
                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>

                  <input
                    id="specialization"
                    type="text"
                    placeholder="e.g. Cardiology"
                    value={specialization}
                    onChange={(event) =>
                      setSpecialization(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="qualification">Qualification</label>

                  <input
                    id="qualification"
                    type="text"
                    placeholder="e.g. MBBS, MD"
                    value={qualification}
                    onChange={(event) =>
                      setQualification(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="experience">Experience (years)</label>

                  <input
                    id="experience"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="licenseNumber">
                    Medical License Number
                  </label>

                  <input
                    id="licenseNumber"
                    type="text"
                    placeholder="Enter license number"
                    value={licenseNumber}
                    onChange={(event) =>
                      setLicenseNumber(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="consultationFee">
                    Consultation Fee
                  </label>

                  <input
                    id="consultationFee"
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={consultationFee}
                    onChange={(event) =>
                      setConsultationFee(event.target.value)
                    }
                    required
                  />
                </div>
              </>
            )}

            <button className="auth-submit" type="submit">
              Create Account
            </button>
          </form>

          {message && (
            <p
              className={`auth-message ${
                message.includes("successful") ? "success-message" : ""
              }`}
            >
              {message}
            </p>
          )}

          <p className="auth-footer">
            Already have an account?{" "}
            <a href="/login">Login here</a>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;