import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import UserDashboard from './pages/UserDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function App() {
  const location = useLocation();

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="logo">AI Feedback System</div>
          <nav className="nav-links">
            <Link
              to="/"
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              User Dashboard
            </Link>
            <Link
              to="/admin"
              className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}
            >
              Admin Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <span>Built with React, FastAPI & Gemini 2.5 Flash</span>
      </footer>
    </div>
  );
}

export default App;
