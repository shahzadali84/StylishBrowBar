/* Stylish Brow Bar: styles the Featurable reviews widget.
   WHY THIS EXISTS: the widget draws itself inside a "shadow root", which the site's styles.css cannot reach.
   This file runs BEFORE the widget loads, and adds our style sheet inside the widget as it is created.
   It must be loaded in the <head>, above the Featurable script. To change colours, edit the CSS below. */
(function () {
  var CSS = `
/* Stylish Brow Bar: paste THIS into Featurable's "Custom CSS" box for the widget.
   (The widget is inside a shadow root, so only this box can style it.)
   Doubled class names (.x.x) raise specificity so these rules beat the widget's own. */

/* Fonts */
[class*="ReviewCard-module"] *,
[class*="SummaryBar-module"],
[class*="SummaryBar-module"] * {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
}
h1, h2, h3, h4 {
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif !important;
  color: #2D2A27 !important;
  font-weight: 600 !important;
}

/* Summary strip: "Excellent 5.0 | Google | Based on 61 reviews | Write a review" */
.summary-bar.summary-bar {
  background: #FFFFFF !important;
  border: 1px solid #E4D8C8 !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 24px rgba(45, 42, 39, 0.08) !important;
}
.summary-bar__label.summary-bar__label {
  color: #2D2A27 !important;
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif !important;
  font-weight: 600 !important;
}
.summary-bar__rating.summary-bar__rating {
  color: #2D2A27 !important;
  font-weight: 600 !important;
}
.summary-bar__sublabel.summary-bar__sublabel {
  color: #625A53 !important;
}
.summary-bar__profile-link.summary-bar__profile-link {
  color: #8F6B3E !important;
}

/* "Write a review" button (was blue) */
a.summary-bar__btn.summary-bar__btn {
  background: #8F6B3E !important;
  border: 2px solid #8F6B3E !important;
  color: #FFFFFF !important;
  border-radius: 999px !important;
  font-weight: 600 !important;
}
a.summary-bar__btn.summary-bar__btn:hover,
a.summary-bar__btn.summary-bar__btn:focus {
  background: #765632 !important;
  border-color: #765632 !important;
  color: #FFFFFF !important;
}
a.summary-bar__btn.summary-bar__btn span {
  color: #FFFFFF !important;
}

/* Stars (the widget colours them inline, so !important is needed) */
.star-rating__fill.star-rating__fill span,
.star-rating__fill.star-rating__fill svg {
  color: #B8935A !important;
}
.star-rating__empty.star-rating__empty span,
.star-rating__empty.star-rating__empty svg {
  color: #E4D8C8 !important;
}
[class*="StarRating-module__starFilled"] {
  color: #B8935A !important;
  fill: #B8935A !important;
}
[class*="StarRating-module__starEmpty"] {
  color: #E4D8C8 !important;
  fill: #E4D8C8 !important;
}

/* Review cards */
[class*="ReviewCard-module__reviewCard"] {
  background: #FFFFFF !important;
  border: 1px solid #E4D8C8 !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 24px rgba(45, 42, 39, 0.08) !important;
  color: #2D2A27 !important;
}
.review__reviewer-name.review__reviewer-name {
  color: #2D2A27 !important;
  font-weight: 600 !important;
}
[class*="review__date"] {
  color: #625A53 !important;
}
[class*="ReviewCard-module__reviewBody"] {
  color: #2D2A27 !important;
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif !important;
  font-size: 1.05rem !important;
  line-height: 1.55 !important;
}
[class*="ReviewCard-module__readMore"] {
  color: #8F6B3E !important;
}
/* initial-letter avatars: one calm gold instead of random colours */
[class*="ReviewCard-module__fallback"] {
  background-color: #B8935A !important;
  color: #FFFFFF !important;
}

/* Carousel arrows */
[class*="Carousel-module__btn"],
[class*="Slider-module__btn"] {
  background: #FFFFFF !important;
  color: #8F6B3E !important;
  border: 1px solid #E4D8C8 !important;
}

/* The "Powered by Featurable" badge and the Google logo are left alone on purpose. */
`;
  var original = Element.prototype.attachShadow;
  if (typeof original !== "function") return;
  Element.prototype.attachShadow = function (init) {
    var options = init;
    if (init && typeof init === "object") { options = Object.assign({}, init, { mode: "open" }); }
    var root = original.call(this, options);
    try {
      if (typeof CSSStyleSheet !== "undefined" && "adoptedStyleSheets" in root) {
        var sheet = new CSSStyleSheet();
        sheet.replaceSync(CSS);
        root.adoptedStyleSheets = Array.prototype.concat.call([], root.adoptedStyleSheets, [sheet]);
      } else {
        var style = document.createElement("style");
        style.textContent = CSS;
        root.appendChild(style);
      }
    } catch (e) { /* never break the page */ }
    return root;
  };
})();
