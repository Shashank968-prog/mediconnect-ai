import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const loadUser = async () => {
      try {
        const response = await api.get("/api/profile");
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    loadUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">✚</span>
        MediConnect AI
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {!user && (
          <>
            <Link to="/login">Login</Link>

            <Link to="/register" className="nav-register">
              Register
            </Link>
          </>
        )}

        {user?.role === "patient" && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/doctors">Doctors</Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/assistant">AI Assistant</Link>
            <Link to="/profile">Profile</Link>

            <button
              className="nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}

        {user?.role === "doctor" && (
          <>
            <Link to="/doctor-dashboard">
              Doctor Dashboard
            </Link>

            <Link to="/profile">Profile</Link>

            <button
              className="nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <Link to="/admin-dashboard">
              Admin Dashboard
            </Link>

            <Link to="/profile">Profile</Link>

            <button
              className="nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;