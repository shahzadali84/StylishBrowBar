/**
 * Stylish Brow Bar - Featurable Reviews API
 * DIAGNOSTIC VERSION
 *
 * This file intentionally gives visible error messages if anything
 * prevents the reviews from loading.
 */

(function () {
  "use strict";

  const WIDGET_ID = "b3384703-4fcf-4397-882b-37e4ff61886e";
  const API_URL =
    "https://featurable.com/api/v1/widgets/" + WIDGET_ID;

  const grid = document.getElementById("review-grid");
  const status = document.getElementById("reviews-status");
  const averageRating = document.getElementById("average-rating");
  const totalReviews = document.getElementById("total-reviews");
  const stars = document.getElementById("rating-stars");
  const googleLink = document.getElementById("google-reviews-link");

  function setStatus(message, isError) {
    if (!status) {
      console.error("reviews-status element was not found:", message);
      return;
    }

    status.textContent = message;
    status.style.display = "block";
    status.style.color = isError ? "#b42318" : "";
  }

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
      review.reviewer?.displayName ||
      review.reviewer?.name ||
      review.displayName ||
      review.name ||
      "Google reviewer"
    );
  }

  function getComment(review) {
    return (
      review.comment ||
      review.text ||
      review.content ||
      ""
    );
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
    const rounded = Math.max(
      0,
      Math.min(5, Math.round(Number(rating) || 0))
    );

    return "★".repeat(rounded) +
      "☆".repeat(5 - rounded);
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
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  function renderReviews(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Featurable returned an invalid JSON response.");
    }

    const reviews = Array.isArray(data.reviews)
      ? data.reviews
      : [];

    const rating = Number(data.averageRating || 0);
    const count = Number(
      data.totalReviewCount || reviews.length
    );

    if (averageRating) {
      averageRating.textContent =
        rating ? rating.toFixed(1) : "—";
    }

    if (totalReviews) {
      totalReviews.textContent =
        count + " review" + (count === 1 ? "" : "s");
    }

    if (stars) {
      stars.textContent = renderStars(rating);
    }

    if (googleLink) {
      googleLink.href =
        data.profileUrl ||
        "https://www.google.com/search?q=Stylish+Brow+Bar+Ottawa";
    }

    if (!grid) {
      throw new Error(
        "The #review-grid element was not found in reviews.html."
      );
    }

    if (!reviews.length) {
      grid.innerHTML =
        '<p class="reviews-status">Featurable returned no reviews.</p>';
      return;
    }

    grid.innerHTML = reviews.map(function (review) {
      const name = getName(review);
      const comment = getComment(review);
      const rating = getRating(review);
      const date = formatDate(getDate(review));

      return `
        <article class="custom-review">
          <div class="custom-review-stars"
               aria-label="${escapeHtml(rating)} out of 5 stars">
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

            <div class="custom-review-google"
                 aria-label="Google review">
              Google
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  async function loadReviews() {
    setStatus("Connecting to Google reviews…", false);

    try {
      console.log(
        "Stylish Brow Bar reviews: requesting",
        API_URL
      );

      const response = await fetch(API_URL, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      console.log(
        "Stylish Brow Bar reviews: HTTP status",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          "Featurable API returned HTTP " +
          response.status +
          " " +
          response.statusText
        );
      }

      const data = await response.json();

      console.log(
        "Stylish Brow Bar reviews: API response",
        data
      );

      renderReviews(data);

      setStatus("", false);
      if (status) {
        status.style.display = "none";
      }

    } catch (error) {
      console.error(
        "Stylish Brow Bar reviews failed:",
        error
      );

      setStatus(
        "Unable to load reviews. " +
        (error && error.message
          ? error.message
          : "Unknown error.") +
        " Open your browser console for details.",
        true
      );
    }
  }

  // This confirms that the JavaScript file itself loaded.
  console.log(
    "Stylish Brow Bar reviews-api.js loaded successfully."
  );

  if (!grid) {
    setStatus(
      "Error: #review-grid was not found in reviews.html.",
      true
    );
  }

  loadReviews();
})();
