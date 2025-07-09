import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header glass">
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo floating">
              <img src="/data sai logo png.png" alt="DataAnalyzer Pro" className="logo-img" />
              <span className="logo-text">DataAnalyzer Pro</span>
            </div>
            <div className="nav-links">
              <a href="#about" className="nav-link">About</a>
              <a href="#tracks" className="nav-link">Tracks</a>
              <a href="#prizes" className="nav-link">Prizes</a>
              <a href="#register" className="nav-link btn-nav">Register</a>
            </div>
            <div className="mobile-menu-toggle">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;