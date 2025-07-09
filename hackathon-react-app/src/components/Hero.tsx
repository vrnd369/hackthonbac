import React from 'react';
import './Hero.css';

const Hero: React.FC = () => {
  return (
    <section className="hero bg-gradient-animated">
      <div className="particles">
        <div className="particle" style={{ left: '10%', animationDelay: '0s' }}></div>
        <div className="particle" style={{ left: '20%', animationDelay: '2s' }}></div>
        <div className="particle" style={{ left: '30%', animationDelay: '4s' }}></div>
        <div className="particle" style={{ left: '40%', animationDelay: '6s' }}></div>
        <div className="particle" style={{ left: '50%', animationDelay: '8s' }}></div>
        <div className="particle" style={{ left: '60%', animationDelay: '10s' }}></div>
        <div className="particle" style={{ left: '70%', animationDelay: '12s' }}></div>
        <div className="particle" style={{ left: '80%', animationDelay: '14s' }}></div>
        <div className="particle" style={{ left: '90%', animationDelay: '16s' }}></div>
      </div>
      
      <div className="container">
        <div className="hero-content text-center">
          <div className="hero-badge floating glass animate-on-scroll">
            <span className="emoji">🚀</span>
            <span>Virtual Hackathon 2025</span>
          </div>
          
          <h1 className="hero-title animate-on-scroll">
            <span className="text-gradient">DataAnalyzer Pro</span><br />
            <span className="hero-subtitle-text">Hackathon 2025</span>
          </h1>
          
          <p className="hero-subtitle animate-on-scroll">
            "Think Like an Analyst. Present Like a Pro."
          </p>
          
          <p className="hero-description animate-on-scroll">
            A 48-hour virtual hackathon where aspiring data professionals turn raw data into real-world insights — using the power of Python.
          </p>
          
          <div className="hero-meta animate-on-scroll">
            <div className="meta-item glass interactive-card">
              <span className="emoji">🗓</span>
              <div className="meta-content">
                <span className="meta-label">Date</span>
                <span className="meta-value">July 25–26, 2025</span>
              </div>
            </div>
            <div className="meta-item glass interactive-card">
              <span className="emoji">🌐</span>
              <div className="meta-content">
                <span className="meta-label">Format</span>
                <span className="meta-value">100% Virtual</span>
              </div>
            </div>
            <div className="meta-item glass interactive-card">
              <span className="emoji">💻</span>
              <div className="meta-content">
                <span className="meta-label">Tools</span>
                <span className="meta-value code-font">Python Only</span>
              </div>
            </div>
          </div>
          
          <div className="hero-actions animate-on-scroll">
            <a href="#register" className="btn btn-primary">
              <span>Register Now</span>
              <span className="arrow">→</span>
            </a>
            <a href="#about" className="btn btn-outline">
              <span>Learn More</span>
            </a>
          </div>
          
          <div className="hero-stats animate-on-scroll">
            <div className="stat-item">
              <div className="stat-number">48</div>
              <div className="stat-label">Hours</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">$500+</div>
              <div className="stat-label">Prizes</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">Global</div>
              <div className="stat-label">Community</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;