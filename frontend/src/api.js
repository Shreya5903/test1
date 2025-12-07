// Simple API wrapper for backend calls

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  return res.json();
}

export async function submitReview({ name, rating, review_text }) {
  const res = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, rating, review_text })
  });
  return handleResponse(res);
}

export async function fetchReviews() {
  const res = await fetch(`${BASE_URL}/reviews`);
  return handleResponse(res);
}
