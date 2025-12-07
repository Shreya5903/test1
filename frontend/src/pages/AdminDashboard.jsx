import React, { useEffect, useState, useMemo } from 'react';
import { fetchReviews } from '../api.js';
import SubmissionsTable from '../components/SubmissionsTable.jsx';

function AdminDashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = async () => {
    try {
      setError('');
      const data = await fetchReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    const interval = setInterval(loadReviews, 5000); // live-ish updates
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (!reviews.length) return { avgRating: 0, total: 0, distribution: {} };
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = (sum / total).toFixed(2);
    const distribution = {};
    for (let i = 1; i <= 5; i++) distribution[i] = 0;
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });
    return { avgRating, total, distribution };
  }, [reviews]);

  return (
    <section className="page">
      <div className="card">
        <h1 className="card-title">Admin Dashboard</h1>
        <p className="card-subtitle">
          View all user submissions, AI summaries, and suggested actions in one place.
        </p>

        <div className="analytics-grid">
          <div className="metric">
            <span className="metric-label">Total Reviews</span>
            <span className="metric-value">{stats.total}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Average Rating</span>
            <span className="metric-value">{stats.avgRating}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Rating Breakdown</span>
            <div className="metric-breakdown">
              {Object.entries(stats.distribution).map(([rating, count]) => (
                <span key={rating}>
                  {rating}★: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error mt-sm">{error}</div>}
      </div>

      <div className="card mt-lg">
        <div className="card-header-row">
          <h2 className="card-title">Submissions</h2>
          <button className="btn subtle" onClick={loadReviews} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading submissions...</p>
        ) : reviews.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          <SubmissionsTable reviews={reviews} />
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;
