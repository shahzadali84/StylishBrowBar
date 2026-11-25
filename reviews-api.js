/**
 * Stylish Brow Bar - Featurable Reviews API
 *
 * Fetches review data from Featurable and renders the reviews
 * directly into the page without using the Featurable embedded widget.
 */

(function () {
  "use strict";

  const WIDGET_ID = "b3384703-4fcf-4397-882b-37e4ff61886e";
  const API_URL = `https://featurable.com/api/v1/widgets/${WIDGET_ID}`;

  const grid = document.getElementById("review-grid");
  const status = document.getElementById("reviews-status");
  const averageRating = document.getElementById("average-rating");
  const totalReviews = document.getElementById("total-reviews");
  const stars = document.getElementById("rating-stars");
  const googleLink = document.getElementById("google-reviews-link");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getRating(review) {
    return Number(review.rating ?? review.stars ?? 5);
  }

  function getName(review) {
    return (
      review.displayName ||
      review.name ||
      review.reviewer?.displayName ||
      review.reviewer?.name ||
      "Google reviewer"
    );
  }

  function getComment(review) {
    return review.comment || review.text || review.content || "";
  }

  function getDate(review) {
    return (
      review.reviewDate ||
      review.date ||
      review.createdAt ||
      review.publishedAt ||
      ""
    );
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return escapeHtml(value);
    }

    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function renderStars(rating) {
    const rounded = Math.round(Number(rating) || 0);
    return "★".repeat(rounded) + "☆".repeat(Math.max(0, 5 - rounded));
  }

  function getInitials(name) {
    const parts = String(name || "G")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  function renderReviews(data) {
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];

    const rating = Number(
      data.averageRating ??
      data.average_rating ??
      data.rating ??
      0
    );

    const count = Number(
      data.totalReviewCount ??
      data.totalReviews ??
      data.reviewCount ??
      reviews.length
    );

    if (averageRating) {
      averageRating.textContent = rating ? rating.toFixed(1) : "—";
    }

    if (totalReviews) {
      totalReviews.textContent = `${count} review${count === 1 ? "" : "s"}`;
    }

    if (stars) {
      stars.textContent = renderStars(rating);
    }

    if (googleLink) {
      googleLink.href =
        data.profileUrl ||
        data.googleProfileUrl ||
        "https://www.google.com/search?q=Stylish+Brow+Bar+Ottawa";
    }

    if (!grid) return;

    if (!reviews.length) {
      grid.innerHTML =
        '<p class="reviews-status">No reviews are currently available.</p>';
      return;
    }

    grid.innerHTML = reviews
      .map(function (review) {
        const name = getName(review);
        const comment = getComment(review);
        const rating = getRating(review);
        const date = formatDate(getDate(review));

        return `
          <article class="custom-review">
            <div class="custom-review-stars" aria-label="${rating} out of 5 stars">
              ${escapeHtml(renderStars(rating))}
            </div>

            <p class="custom-review-text">
              ${escapeHtml(comment)}
            </p>

            <div class="custom-review-footer">
              <div class="custom-review-avatar" aria-hidden="true">
                ${escapeHtml(getInitials(name))}
              </div>

              <div>
                <div class="custom-review-name">
                  ${escapeHtml(name)}
                </div>

                ${
                  date
                    ? `<div class="custom-review-date">${date}</div>`
                    : ""
                }
              </div>

              <div class="custom-review-google" aria-label="Google review">
                Google
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function showError() {
    if (status) {
      status.textContent =
        "Reviews are temporarily unavailable. Please check Google for the latest reviews.";
    }
  }

  async function loadReviews() {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Featurable API returned ${response.status}`);
      }

      const data = await response.json();

      renderReviews(data);

      if (status) {
        status.textContent = "";
      }
    } catch (error) {
      console.error("Unable to load Featurable reviews:", error);
      showError();
    }
  }

  loadReviews();
})();
