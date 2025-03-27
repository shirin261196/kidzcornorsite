import React, { useState } from 'react';

const ReviewForm = ({ productId, onReviewSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!rating || !comment.trim()) {
      setError('Please provide both a rating and a comment.');
      return;
    }

    // Submit the review
    try {
      const response = await fetch(`/api/products/${productId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();

      if (response.ok) {
        onReviewSubmit(data.reviews); // Update reviews list
        setRating(0);
        setComment('');
        setError('');
      } else {
        setError(data.message || 'Failed to submit the review.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="review-form mt-4">
      <h4>Write a Review</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="rating" className="form-label">
            Rating:
          </label>
          <select
            id="rating"
            className="form-select"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value="0">Select a rating</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} Star{value > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="comment" className="form-label">
            Review Description:
          </label>
          <textarea
            id="comment"
            className="form-control"
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience about this product"
          ></textarea>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit Review
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
