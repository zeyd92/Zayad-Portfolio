// Floating contact button toggle
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("contact-btn");
  const card = document.getElementById("contact-card");
  btn.addEventListener("click", () => {
    card.classList.toggle("show");
  });
});

// Theme toggle - saves preference and respects system preference
(function () {
  const KEY = 'theme';
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const stored = localStorage.getItem(KEY);
  const devicePreferedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const current = stored || (devicePreferedTheme ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', current);
  btn.setAttribute('aria-pressed', current === 'dark');
  btn.textContent = current === 'dark' ? '☀️' : '🌑';

  btn.addEventListener('click', () => {
    const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', now);
    localStorage.setItem(KEY, now);
    btn.setAttribute('aria-pressed', now === 'dark');
    btn.textContent = now === 'dark' ? '☀️' : '🌑';
  });
})();

// Project details toggle buttons
document.querySelectorAll('.toggle-details').forEach(button => {
  button.addEventListener('click', () => {
    const details = button.nextElementSibling;

    details.classList.toggle('active');

    if (details.classList.contains('active')) {
      details.style.maxHeight = details.scrollHeight + "px";
      button.textContent = '▲ Hide details';
    } else {
      details.style.maxHeight = "0px";
      button.textContent = '▼ More details';
    }
  });
});

// Project search filter - filters by project title
(function () {
  const input = document.getElementById('project-search');
  if (!input) return;

  const projects = Array.from(document.querySelectorAll('#projects .project'));
  const emptyMsg = document.getElementById('projects-empty');

  const filter = (q) => {
    const query = q.trim().toLowerCase();
    let visibleCount = 0;

    projects.forEach(card => {
      const titleEl = card.querySelector('.project-left h3');
      const title = (titleEl?.textContent || '').toLowerCase();
      const match = title.startsWith(query);
      card.classList.toggle('is-hidden', !match);
      if (match) visibleCount++;
    });

    if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
  };

  input.addEventListener('input', (e) => filter(e.target.value));
  filter(input.value || '');
})();

// Greeting system - personalized greeting with localStorage persistence
(function () {
  const nameInput = document.getElementById('name-input');
  const saveBtn = document.getElementById('save-name');
  const editBtn = document.getElementById('edit-name');
  const greetingMsg = document.getElementById('greeting-message');
  const nameInputMobile = document.getElementById('name-input-mobile');
  const saveBtnMobile = document.getElementById('save-name-mobile');
  const greetingMsgMobile = document.getElementById('greeting-message-mobile');
  const KEY = 'username';

  // Get time-based greeting (morning/afternoon/evening)
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  // Read username from localStorage (no fallbacks)
  function getStoredUsername() {
    const stored = localStorage.getItem(KEY);
    return stored ? stored.trim() : null;
  }

  // Update greeting text in both desktop and mobile views
  function render() {
    const name = getStoredUsername();
    const greetingText = name ? `${getGreeting()}, ${name}!` : `${getGreeting()}!`;
    if (greetingMsg) greetingMsg.textContent = greetingText;
    if (greetingMsgMobile) greetingMsgMobile.textContent = greetingText;
  }

  function updateUI() {
    const saved = getStoredUsername();
    if (saved) {
      if (nameInput) {
        nameInput.value = saved;
        nameInput.style.display = 'none';
      }
      if (saveBtn) saveBtn.style.display = 'none';
      if (editBtn) editBtn.hidden = false;
      if (nameInputMobile) {
        nameInputMobile.value = saved;
        nameInputMobile.style.display = 'none';
      }
      if (saveBtnMobile) saveBtnMobile.style.display = 'none';
    } else {
      if (nameInput) {
        nameInput.value = '';
        nameInput.style.display = '';
      }
      if (saveBtn) saveBtn.style.display = '';
      if (editBtn) editBtn.hidden = true;
      if (nameInputMobile) {
        nameInputMobile.value = '';
        nameInputMobile.style.display = '';
      }
      if (saveBtnMobile) saveBtnMobile.style.display = '';
    }
  }

  function saveUsername(name) {
    const trimmedName = name.trim();
    if (trimmedName) {
      localStorage.setItem(KEY, trimmedName);
    } else {
      localStorage.removeItem(KEY);
    }
    render();
    updateUI();
  }

  render();
  updateUI();

  // Listen for storage changes from other tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      render();
      updateUI();
    }
  });

  // Listen for same-tab storage changes (via overridden methods below)
  window.addEventListener('localStorageChange', () => {
    render();
    updateUI();
  });

  saveBtn?.addEventListener('click', () => {
    const v = (nameInput?.value || '').trim();
    if (!v) {
      alert('Please enter your name first!');
      return;
    }
    saveUsername(v);
  });

  saveBtnMobile?.addEventListener('click', () => {
    const v = (nameInputMobile?.value || '').trim();
    if (!v) {
      alert('Please enter your name first!');
      return;
    }
    saveUsername(v);
  });

  editBtn?.addEventListener('click', () => {
    const v = getStoredUsername() || '';
    if (nameInput) {
      nameInput.value = v;
      nameInput.style.display = '';
      nameInput.focus();
    }
    if (saveBtn) saveBtn.style.display = '';
    if (editBtn) editBtn.hidden = true;
  });

  nameInput?.addEventListener('input', (e) => {
    if (nameInputMobile) nameInputMobile.value = e.target.value;
  });

  nameInputMobile?.addEventListener('input', (e) => {
    if (nameInput) nameInput.value = e.target.value;
  });

  // Override localStorage methods to detect same-tab changes
  // (storage event only fires for cross-tab changes)
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;

  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (key === KEY) {
      window.dispatchEvent(new Event('localStorageChange'));
    }
  };

  localStorage.removeItem = function(key) {
    originalRemoveItem.apply(this, arguments);
    if (key === KEY) {
      window.dispatchEvent(new Event('localStorageChange'));
    }
  };

  localStorage.clear = function() {
    originalClear.apply(this, arguments);
    window.dispatchEvent(new Event('localStorageChange'));
  };
})();

// Fetch and display GitHub repositories
(function () {
  const container = document.getElementById("github-list");
  if (!container) return;

  fetch("https://api.github.com/users/zeyd92/repos")
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      if (!Array.isArray(data)) {
        container.innerHTML = "<p>Failed to load GitHub repos.</p>";
        return;
      }

      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      data.slice(0, 5).forEach(repo => {
        const created = new Date(repo.created_at).toLocaleDateString();
        const card = document.createElement("div");
        card.className = "github-repo-card";

        card.innerHTML = `
          <div class="repo-date">${created}</div>
          <h3>${repo.name}</h3>
          <p>${repo.description || "No description available."}</p>
          <a href="${repo.html_url}" target="_blank">View Repository</a>
        `;

        container.appendChild(card);
      });
    })
    .catch(() => {
      container.innerHTML = "<p>Failed to load GitHub repos.</p>";
    });
})();

// Contact form validation
(function () {
  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const msgInput = document.getElementById("contact-message");
  const submitBtn = document.getElementById("contact-submit");
  const errName = document.getElementById("error-name");
  const errEmail = document.getElementById("error-email");
  const errMsg = document.getElementById("error-message");
  const successMsg = document.getElementById("contact-success");

  if (!submitBtn) return;

  submitBtn.addEventListener("click", function (e) {
    e.preventDefault();

    let valid = true;
    errName.textContent = "";
    errEmail.textContent = "";
    errMsg.textContent = "";
    successMsg.textContent = "";

    // Validate name (minimum 2 characters)
    if (nameInput.value.trim().length < 2) {
      errName.textContent = "Enter a valid name.";
      valid = false;
    }

    // Validate email format (basic check)
    const email = emailInput.value.trim();
    if (!email.includes("@") || !email.includes(".")) {
      errEmail.textContent = "Enter a valid email.";
      valid = false;
    }

    // Validate message (minimum 10 characters)
    if (msgInput.value.trim().length < 10) {
      errMsg.textContent = "Message must be at least 10 characters.";
      valid = false;
    }

    if (valid) {
      successMsg.textContent = "Message sent successfully!";
      nameInput.value = "";
      emailInput.value = "";
      msgInput.value = "";
    }
  });
})();

// Scroll animation for project cards using Intersection Observer
(function () {
  const projects = document.querySelectorAll('.project');
  if (projects.length === 0) return;

  // Animate cards when they enter viewport (fade-in and slide-up)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Stop observing after animation
      }
    });
  }, {
    threshold: 0.1, // Trigger when 10% visible
    rootMargin: '0px 0px -50px 0px' // Trigger 50px before entering viewport
  });

  projects.forEach(project => {
    observer.observe(project);
  });
})();
