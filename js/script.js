"use strict";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

/* ========================================
   Theme toggle
======================================== */

(() => {
  const button = $("#theme-toggle");

  if (!button) return;

  const savedTheme = localStorage.getItem("theme");

  const systemTheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    button.textContent = theme === "dark" ? "☀️" : "🌙";

    button.setAttribute(
      "aria-pressed",
      String(theme === "dark")
    );

    button.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} theme`
    );
  }

  applyTheme(savedTheme || systemTheme);

  button.addEventListener("click", () => {
    const currentTheme =
      document.documentElement.dataset.theme;

    const newTheme =
      currentTheme === "dark" ? "light" : "dark";

    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });
})();

/* ========================================
   Personalized greeting
======================================== */

(() => {
  const input = $("#name-input");
  const saveButton = $("#save-name");
  const editButton = $("#edit-name");
  const message = $("#greeting-message");

  if (!input || !saveButton || !editButton || !message) {
    return;
  }

  const storageKey = "portfolioVisitorName";

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  }

  function renderGreeting() {
    const savedName =
      localStorage.getItem(storageKey)?.trim() || "";

    message.textContent = savedName
      ? `${getGreeting()}, ${savedName}!`
      : `${getGreeting()}!`;

    input.hidden = Boolean(savedName);
    saveButton.hidden = Boolean(savedName);
    editButton.hidden = !savedName;

    input.value = savedName;
  }

  function saveName() {
    const name = input.value.trim().slice(0, 30);

    if (!name) {
      input.focus();
      return;
    }

    localStorage.setItem(storageKey, name);
    renderGreeting();
  }

  saveButton.addEventListener("click", saveName);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      saveName();
    }
  });

  editButton.addEventListener("click", () => {
    input.hidden = false;
    saveButton.hidden = false;
    editButton.hidden = true;

    input.focus();
    input.select();
  });

  renderGreeting();
})();

/* ========================================
   Project details buttons
======================================== */

$$(".toggle-details").forEach(button => {
  button.addEventListener("click", () => {
    const details = button.nextElementSibling;

    if (!details?.classList.contains("details")) {
      return;
    }

    const isExpanded =
      button.getAttribute("aria-expanded") === "true";

    button.setAttribute(
      "aria-expanded",
      String(!isExpanded)
    );

    button.textContent = isExpanded
      ? "▼ More details"
      : "▲ Hide details";

    details.classList.toggle("active", !isExpanded);

    details.style.maxHeight = isExpanded
      ? "0px"
      : `${details.scrollHeight}px`;
  });
});

/* ========================================
   Project search
======================================== */

(() => {
  const searchInput = $("#project-search");
  const emptyMessage = $("#projects-empty");
  const projects = $$("#projects .project");

  if (!searchInput) return;

  function filterProjects() {
    const searchText =
      searchInput.value.trim().toLowerCase();

    let visibleProjects = 0;

    projects.forEach(project => {
      const projectContent =
        project.textContent.toLowerCase();

      const matches =
        projectContent.includes(searchText);

      project.classList.toggle(
        "is-hidden",
        !matches
      );

      if (matches) {
        visibleProjects++;
      }
    });

    if (emptyMessage) {
      emptyMessage.hidden = visibleProjects > 0;
    }
  }

  searchInput.addEventListener(
    "input",
    filterProjects
  );

  filterProjects();
})();

/* ========================================
   GitHub repositories
======================================== */

(async () => {
  const container = $("#github-list");

  if (!container) return;

  try {
    const response = await fetch(
      "https://api.github.com/users/zeyd92/repos?sort=updated&per_page=5"
    );

    if (!response.ok) {
      throw new Error(
        `GitHub request failed: ${response.status}`
      );
    }

    const repositories = await response.json();

    if (!Array.isArray(repositories)) {
      throw new Error(
        "Unexpected GitHub response"
      );
    }

    container.innerHTML = "";

    repositories.slice(0, 5).forEach(repo => {
      const card =
        document.createElement("article");

      card.className = "github-repo-card";

      const updatedDate =
        new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        }).format(new Date(repo.updated_at));

      const language =
        repo.language || "Repository";

      card.innerHTML = `
        <div class="repo-meta">
          <span>${language}</span>
          <span>Updated ${updatedDate}</span>
        </div>

        <h3></h3>
        <p></p>

        <a
          target="_blank"
          rel="noopener noreferrer"
        >
          View repository ↗
        </a>
      `;

      $("h3", card).textContent = repo.name;

      $("p", card).textContent =
        repo.description ||
        "No description has been added yet.";

      $("a", card).href = repo.html_url;

      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <p class="loading-message">
        GitHub repositories could not be loaded right now.
      </p>
    `;
  }
})();

/* ========================================
   Contact form
======================================== */

(() => {
  const form = $("#contact-form");
  const submitButton = $("#contact-submit");
  const statusMessage = $("#contact-success");

  if (!form || !submitButton || !statusMessage) {
    return;
  }

  const fields = {
    name: {
      input: $("#contact-name"),
      error: $("#error-name"),
      minimumLength: 2
    },

    email: {
      input: $("#contact-email"),
      error: $("#error-email")
    },

    message: {
      input: $("#contact-message"),
      error: $("#error-message"),
      minimumLength: 10
    }
  };

  function clearErrors() {
    Object.values(fields).forEach(field => {
      if (field.error) {
        field.error.textContent = "";
      }
    });
  }

  function validateForm() {
    let isValid = true;

    clearErrors();

    const name =
      fields.name.input.value.trim();

    const email =
      fields.email.input.value.trim();

    const message =
      fields.message.input.value.trim();

    if (
      name.length <
      fields.name.minimumLength
    ) {
      fields.name.error.textContent =
        "Please enter at least 2 characters.";

      isValid = false;
    }

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!validEmail.test(email)) {
      fields.email.error.textContent =
        "Please enter a valid email address.";

      isValid = false;
    }

    if (
      message.length <
      fields.message.minimumLength
    ) {
      fields.message.error.textContent =
        "Please enter at least 10 characters.";

      isValid = false;
    }

    return isValid;
  }

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      statusMessage.textContent = "";
      statusMessage.className = "form-status";

      if (!validateForm()) {
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Sending…";

      try {
        const response = await fetch(
          form.action,
          {
            method: "POST",
            body: new FormData(form),
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error(
            "Form submission failed"
          );
        }

        form.reset();

        statusMessage.textContent =
          "Message sent successfully.";

        statusMessage.classList.add(
          "success"
        );
      } catch (error) {
        console.error(error);

        statusMessage.textContent =
          "The message could not be sent. Please try again.";

        statusMessage.classList.add(
          "failure"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent =
          "Send message";
      }
    }
  );
})();

/* ========================================
   Floating contact card
======================================== */

(() => {
  const button = $("#contact-btn");
  const card = $("#contact-card");

  if (!button || !card) return;

  function closeContactCard() {
    card.classList.remove("show");

    button.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  button.addEventListener(
    "click",
    event => {
      event.stopPropagation();

      const isOpen =
        card.classList.toggle("show");

      button.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    }
  );

  card.addEventListener("click", event => {
    event.stopPropagation();
  });

  document.addEventListener(
    "click",
    closeContactCard
  );

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeContactCard();
      }
    }
  );
})();

/* ========================================
   Project scroll animations
======================================== */

(() => {
  const projects = $$(".project");

  if (!("IntersectionObserver" in window)) {
    projects.forEach(project => {
      project.classList.add("visible");
    });

    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "visible"
            );

            observer.unobserve(
              entry.target
            );
          }
        });
      },
      {
        threshold: 0.12
      }
    );

  projects.forEach(project => {
    observer.observe(project);
  });
})();

/* ========================================
   Footer year
======================================== */

const currentYear = $("#current-year");

if (currentYear) {
  currentYear.textContent =
    new Date().getFullYear();
  }