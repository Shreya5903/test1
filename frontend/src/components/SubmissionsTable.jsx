import React from 'react';

function SubmissionsTable({ reviews }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Created At</th>
            <th>Name</th>
            <th>Rating</th>
            <th>Review</th>
            <th>AI Summary</th>
            <th>AI Suggested Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>{r.name}</td>
              <td>{r.rating}★</td>
              <td>{r.review_text}</td>
              <td>{r.ai_summary}</td>
              <td>
                <ul className="actions-list">
                  {r.ai_actions
                    ?.split('\n')
                    .filter((line) => line.trim())
                    .map((line, idx) => (
                      <li key={idx}>{line.replace(/^[-•]\s*/, '')}</li>
                    ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SubmissionsTable;
