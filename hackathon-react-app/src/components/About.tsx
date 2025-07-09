import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <section id="about" className="section section-alt">
      <div className="container">
        <div className="about-content">
          <div className="about-text animate-on-scroll">
            <h2>🧠 Discover the Analyst Within You</h2>
            <p className="section-description">
              The DataAnalyzer Pro Hackathon 2025 is a two-day global data challenge for students, analysts, and professionals who love turning numbers into narratives. You'll solve real-world problems using Python — no need for complex setups or our application (still in development). Just you, data, and your analytical mindset.
            </p>
          </div>

          <div className="overview-grid grid grid-2">
            <div className="overview-card card interactive-card animate-on-scroll glass">
              <div className="card-header">
                <h3>📅 Event Details</h3>
                <div className="card-icon">🎯</div>
              </div>
              <div className="detail-list">
                <div className="detail-item">
                  <div className="detail-icon">📅</div>
                  <div className="detail-content">
                    <strong>Date:</strong> July 25–26, 2025
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">🌐</div>
                  <div className="detail-content">
                    <strong>Format:</strong> 100% Virtual
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">⏱️</div>
                  <div className="detail-content">
                    <strong>Duration:</strong> 48 Hours
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">🐍</div>
                  <div className="detail-content">
                    <strong>Tools Allowed:</strong> <span className="code-font">Python</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">💰</div>
                  <div className="detail-content">
                    <strong>Entry Fee:</strong> Free or $10 (your choice)
                  </div>
                </div>
              </div>
            </div>

            <div className="overview-card card interactive-card animate-on-scroll glass">
              <div className="card-header">
                <h3>👥 Who Can Join</h3>
                <div className="card-icon">🌍</div>
              </div>
              <div className="participant-grid">
                <div className="participant-item">
                  <span className="participant-emoji">🎓</span>
                  <div className="participant-content">
                    <span className="participant-title">Students</span>
                    <span className="participant-desc">Learn by doing</span>
                  </div>
                </div>
                <div className="participant-item">
                  <span className="participant-emoji">📊</span>
                  <div className="participant-content">
                    <span className="participant-title">Data Analysts</span>
                    <span className="participant-desc">Showcase skills</span>
                  </div>
                </div>
                <div className="participant-item">
                  <span className="participant-emoji">💡</span>
                  <div className="participant-content">
                    <span className="participant-title">Data Enthusiasts</span>
                    <span className="participant-desc">Explore passion</span>
                  </div>
                </div>
                <div className="participant-item">
                  <span className="participant-emoji">🌍</span>
                  <div className="participant-content">
                    <span className="participant-title">Global Community</span>
                    <span className="participant-desc">Connect worldwide</span>
                  </div>
                </div>
              </div>
              <div className="note glass">
                <div className="note-icon">💡</div>
                <div className="note-content">
                  <strong>Note:</strong> Our platform is still in development — no app usage required!
                </div>
              </div>
            </div>
          </div>

          <div className="features-showcase animate-on-scroll">
            <div className="feature-item floating">
              <div className="feature-icon">🚀</div>
              <h4>No Setup Required</h4>
              <p>Jump straight into analysis with your favorite Python environment</p>
            </div>
            <div className="feature-item floating">
              <div className="feature-icon">🎯</div>
              <h4>Real-World Data</h4>
              <p>Work with authentic datasets that mirror industry challenges</p>
            </div>
            <div className="feature-item floating">
              <div className="feature-icon">🏆</div>
              <h4>Global Recognition</h4>
              <p>Get featured on our platform and build your data science portfolio</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;