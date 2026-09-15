function Home() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-tag">SMARTER HEALTHCARE WITH AI</p>

          <h1>
            Your Health,
            <span> Our Intelligence.</span>
          </h1>

          <p className="hero-description">
            Connect with healthcare professionals, manage appointments,
            and get intelligent health assistance with MediConnect AI.
          </p>

          <div className="hero-buttons">
            <a href="/register" className="primary-button">
              Get Started
            </a>

            <a href="/login" className="secondary-button">
              Login
            </a>
          </div>
        </div>

        <div className="hero-card">
          <div className="health-icon">✚</div>
          <h2>Healthcare, Reimagined</h2>
          <p>
            Personalized healthcare support, anytime and anywhere.
          </p>

          <div className="health-status">
            <span>●</span> AI Healthcare Assistant
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Everything You Need for Better Healthcare</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3>Find Doctors</h3>
            <p>Discover healthcare professionals and explore their profiles.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Book Appointments</h3>
            <p>Schedule and manage your healthcare appointments easily.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Health Assistant</h3>
            <p>Ask questions and explore healthcare information using AI.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;