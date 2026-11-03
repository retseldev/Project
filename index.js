const feedbackForm = document.querySelector("#feedback-form");
const confirmation = document.querySelector("#feedback-confirmation");

if (feedbackForm && confirmation) {
  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!feedbackForm.reportValidity()) {
      return;
    }

    confirmation.hidden = false;
    feedbackForm.reset();
  });

  feedbackForm.addEventListener("input", () => {
    confirmation.hidden = true;
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();