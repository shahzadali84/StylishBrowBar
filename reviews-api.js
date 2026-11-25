/**
 * Stylish Brow Bar - Featurable Reviews API
 * Uses the actual Featurable review field names.
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

  function setStatus(message, error) {
    if (!status) return;

    status.textContent = message;
    status.style.display = message ? "block" : "none";

    if (error) {
      status.style.color = "#b42318";
    } else {
      status.style.color = "";
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderStars(rating) {
    const count = Math.max(
      0,
      Math.min(5, Math.round(Number(rating) || 0))
    );

    return "★".repeat(count) + "☆".repeat(5 - count);
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
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
    if (!grid) {
      throw new Error(
        "reviews.html is missing the #review-grid element."
      );
    }

    // Featurable's current response uses these exact fields.
    const reviews = Array.isArray(data.reviews)
      ? data.reviews
      : [];

    const rating = Number(data.averageRating || 0);
    const count = Number(
      data.totalReviewCount || reviews.length
    );

    console.log(
      "Stylish Brow Bar reviews: rendering",
      reviews.length,
      "reviews"
    );

    if (averageRating) {
      averageRating.textContent =
        rating > 0 ? rating.toFixed(1) : "—";
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

    if (!reviews.length) {
      grid.innerHTML =
        '<p class="reviews-status">No reviews are currently available.</p>';
      return;
    }

    grid.innerHTML = reviews.map(function (review) {
      // These are the actual fields returned by Featurable.
      const name =
        review.reviewer?.displayName ||
        "Google reviewer";

      const comment = review.comment || "";

      const reviewRating =
        Number(review.starRating || 0);

      const date =
        formatDate(review.createTime || review.updateTime);

      const photoUrl =
        review.reviewer?.profilePhotoUrl || "";

      const avatar = photoUrl
        ? `<img src="${escapeHtml(photoUrl)}"
                alt=""
                class="custom-review-avatar-image"
                loading="lazy">`
        : escapeHtml(getInitials(name));

      return `
        <article class="custom-review">
          <div class="custom-review-stars"
               aria-label="${escapeHtml(reviewRating)} out of 5 stars">
            ${escapeHtml(renderStars(reviewRating))}
          </div>

          <p class="custom-review-text">
            ${escapeHtml(comment)}
          </p>

          <div class="custom-review-footer">
            <div class="custom-review-avatar" aria-hidden="true">
              ${avatar}
            </div>

            <div class="custom-review-person">
              <div class="custom-review-name">
                ${escapeHtml(name)}
              </div>

              ${
                date
                  ? `<div class="custom-review-date">${escapeHtml(date)}</div>`
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
    setStatus("Loading reviews…", false);

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

      console.log(
        "Stylish Brow Bar reviews: rendering completed successfully."
      );

    } catch (error) {
      console.error(
        "Stylish Brow Bar reviews failed:",
        error
      );

      setStatus(
        "Unable to load reviews. " +
        (error?.message || "Unknown error."),
        true
      );
    }
  }

  console.log(
    "Stylish Brow Bar reviews-api.js loaded successfully."
  );

  loadReviews();
})();
