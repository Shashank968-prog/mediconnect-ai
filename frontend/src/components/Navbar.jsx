import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">✚</span>
        MediConnect AI
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register" className="nav-register">
          Register
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;