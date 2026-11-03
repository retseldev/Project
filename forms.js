// Login, register and register-school forms (demo only: nothing is sent to a server).
document.querySelectorAll(".demo-form").forEach((form) => {
  const msg = form.querySelector(".form-success");
  const submit = form.querySelector('[type="submit"]');

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;

    const data = new FormData(form);
    const email = String(data.get("email") || data.get("adminEmail") || "").trim().toLowerCase();
    let name = data.get("name") || data.get("adminName");
    let role = data.get("role");

    // Registering remembers the account; logging in looks it up so the right role opens.
    let accounts = {};
    try { accounts = JSON.parse(localStorage.getItem("lw-accounts")) || {}; } catch {}
    if (email && role) {
      accounts[email] = { name, role };
      try { localStorage.setItem("lw-accounts", JSON.stringify(accounts)); } catch {}
    } else if (email && accounts[email]) {
      name = name || accounts[email].name;
      role = role || accounts[email].role;
    }

    try {
      const saved = JSON.parse(sessionStorage.getItem("lw-user")) || {};
      if (name) saved.name = name;
      if (role) saved.role = role;
      sessionStorage.setItem("lw-user", JSON.stringify(saved));
    } catch {}

    if (msg) { msg.textContent = form.dataset.success || "Done."; msg.hidden = false; }
    submit.disabled = true;
    setTimeout(() => { window.location.href = "dashboard.html"; }, 700);
  });
});