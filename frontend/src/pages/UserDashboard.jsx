import React, { useState } from 'react';
import { submitReview } from '../api.js';
import RatingSelect from '../components/RatingSelect.jsx';

function UserDashboard() {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAiResponse('');

    if (!name.trim() || !reviewText.trim()) {
      setError('Please enter your name and review.');
      return;
    }

    try {
      setLoading(true);
      const data = await submitReview({
        name: name.trim(),
        rating,
        review_text: reviewText.trim()
      });
      setAiResponse(data.ai_user_response || 'Thank you for your feedback!');
      setReviewText('');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <div className="card">
        <h1 className="card-title">Share Your Feedback</h1>
        <p className="card-subtitle">
          Rate your experience and leave a short review. Our AI will respond to you instantly.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Shreya"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Rating</label>
            <RatingSelect value={rating} onChange={setRating} />
          </div>

          <div className="form-field">
            <label htmlFor="review">Your review</label>
            <textarea
              id="review"
              rows="4"
              placeholder="Tell us what worked well and what could be better..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit feedback'}
          </button>
        </form>
      </div>

      {aiResponse && (
        <div className="card mt-lg">
          <h2 className="card-title">AI Response</h2>
          <p className="ai-response">{aiResponse}</p>
        </div>
      )}
    </section>
  );
}

export default UserDashboard;
