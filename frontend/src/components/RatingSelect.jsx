import React from 'react';

function RatingSelect({ value, onChange }) {
  return (
    <div className="rating-select">
      {[1, 2, 3, 4, 5].map((r) => (
        <button
          key={r}
          type="button"
          className={r === value ? 'rating-pill selected' : 'rating-pill'}
          onClick={() => onChange(r)}
        >
          {r}★
        </button>
      ))}
    </div>
  );
}

export default RatingSelect;
