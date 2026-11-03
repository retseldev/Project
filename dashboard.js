const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ---------- User and role ---------- */
let user = {};
try { user = JSON.parse(sessionStorage.getItem("lw-user")) || {}; } catch {}
let role = user.role || "teacher";

/* ---------- Demo data (replace with your cloud database) ---------- */
const CHILD = "Mia Santos";
const students = [CHILD, "Leo Cruz", "Zoe Tan", "Noah Lim"];
const advisors = [
  { id: "a1", name: "Ms. Rivera", kind: "Advisor", focus: "Reading and study skills", slots: ["Mon 9:00 AM", "Wed 1:30 PM", "Fri 10:00 AM"] },
  { id: "a2", name: "Mr. Okafor", kind: "Proctor", focus: "Math support and assessments", slots: ["Tue 8:30 AM", "Thu 2:00 PM"] },
  { id: "a3", name: "Ms. Lim", kind: "Advisor", focus: "Learner wellbeing and goals", slots: ["Mon 2:30 PM", "Thu 9:30 AM", "Fri 1:00 PM"] },
];
const d0 = new Date();
const todayKey = "lw-att-" + [d0.getFullYear(), String(d0.getMonth() + 1).padStart(2, "0"), String(d0.getDate()).padStart(2, "0")].join("-");

let appts = load("lw-appts", []);
let sessions = load("lw-sessions", []);
let tutors = load("lw-tutors", [
  { name: "Ana Reyes", subject: "Reading", on: true },
  { name: "Ben Cho", subject: "Math", on: true },
  { name: "Cara Dela Cruz", subject: "Science", on: false },
]);
let att = load(todayKey, {});

const empty = (msg) => `<li class="empty">${msg}</li>`;

/* ---------- Advising ---------- */
function renderAdvisors() {
  $("#advisors").innerHTML = advisors.map((a) => `
    <article class="card">
      <h3>${esc(a.name)}</h3>
      <p>${esc(a.kind)} · ${esc(a.focus)}</p>
      <div class="slots">${a.slots.map((s) => {
        const taken = appts.some((p) => p.id === a.id && p.slot === s);
        return `<button class="slot" data-id="${a.id}" data-slot="${s}" ${taken ? "disabled" : ""}>${s}</button>`;
      }).join("")}</div>
    </article>`).join("");
  $("#appts").innerHTML = appts.length
    ? appts.map((p, i) => `<li><div><strong>${esc(p.name)}</strong> <span>${esc(p.slot)}</span></div><button class="link-btn" data-cancel="${i}">Cancel</button></li>`).join("")
    : empty("No appointments yet. Pick a time above.");
}
$("#advisors").addEventListener("click", (e) => {
  const b = e.target.closest(".slot");
  if (!b) return;
  const a = advisors.find((x) => x.id === b.dataset.id);
  appts.push({ id: a.id, name: a.name, slot: b.dataset.slot });
  save("lw-appts", appts);
  renderAdvisors();
});
$("#appts").addEventListener("click", (e) => {
  const i = e.target.dataset.cancel;
  if (i === undefined) return;
  appts.splice(i, 1);
  save("lw-appts", appts);
  renderAdvisors();
});

/* ---------- Study sessions ---------- */
function renderSessions() {
  $("#session-list").innerHTML = sessions.length
    ? sessions.map((s, i) => `<li><div><strong>${esc(s.subject)}: ${esc(s.topic)}</strong> <span>${esc(s.when)}</span></div><button class="link-btn" data-del="${i}">Remove</button></li>`).join("")
    : empty("No study sessions scheduled. Add one above.");
}
$("#session-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const when = new Date(`${f.get("date")}T${f.get("time")}`).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  sessions.push({ subject: f.get("subject"), topic: f.get("topic"), when });
  save("lw-sessions", sessions);
  e.target.reset();
  renderSessions();
});
$("#session-list").addEventListener("click", (e) => {
  if (e.target.dataset.del === undefined) return;
  sessions.splice(e.target.dataset.del, 1);
  save("lw-sessions", sessions);
  renderSessions();
});

/* ---------- Tutor management ---------- */
function renderTutors() {
  $("#tutor-list").innerHTML = tutors.length
    ? tutors.map((t, i) => `<li><div><strong>${esc(t.name)}</strong> <span>${esc(t.subject)}</span></div>
        <span><button class="pill ${t.on ? "on" : "off"}" data-tog="${i}" aria-pressed="${t.on}">${t.on ? "Available" : "On break"}</button>
        <button class="link-btn" data-rm="${i}">Remove</button></span></li>`).join("")
    : empty("No tutors yet. Add one above.");
}
$("#tutor-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  tutors.push({ name: f.get("name"), subject: f.get("subject"), on: true });
  save("lw-tutors", tutors);
  e.target.reset();
  renderTutors();
});
$("#tutor-list").addEventListener("click", (e) => {
  const d = e.target.dataset;
  if (d.tog !== undefined) tutors[d.tog].on = !tutors[d.tog].on;
  else if (d.rm !== undefined) tutors.splice(d.rm, 1);
  else return;
  save("lw-tutors", tutors);
  renderTutors();
});

/* ---------- Attendance ---------- */
const labels = { present: "Present", late: "Late", absent: "Absent" };
function renderAttendance() {
  $("#roster").innerHTML = students.map((n) => `
    <li><strong>${esc(n)}</strong>
      <div class="choices" role="group" aria-label="Attendance for ${esc(n)}">
        ${Object.keys(labels).map((s) => `<button data-s="${s}" data-n="${esc(n)}" aria-pressed="${att[n] === s}">${labels[s]}</button>`).join("")}
      </div></li>`).join("");
  const c = (s) => students.filter((n) => att[n] === s).length;
  $("#summary").textContent = `${c("present")} present · ${c("late")} late · ${c("absent")} absent · ${students.filter((n) => !att[n]).length} not marked`;
}
$("#roster").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  att[b.dataset.n] = b.dataset.s;
  save(todayKey, att);
  renderAttendance();
  renderParent();
});

/* ---------- Parent portal ---------- */
function renderParent() {
  const s = att[CHILD];
  const msg = {
    present: `${CHILD} is at school today.`,
    late: `${CHILD} arrived late today.`,
    absent: `${CHILD} was marked absent today. Contact the school if this is unexpected.`,
  }[s] || `Attendance for ${CHILD} has not been marked yet today.`;
  $("#child").innerHTML = `<span class="pill ${s || "none"}">${labels[s] || "Not marked"}</span><div><h3>${esc(CHILD)}</h3><p>${esc(msg)}</p></div>`;
  const past = [["Mon", "present"], ["Tue", "present"], ["Wed", "late"], ["Thu", "present"]];
  $("#week").innerHTML = [...past, ["Today", s || "none"]]
    .map(([d, st]) => `<li>${d}<span class="pill ${st}">${labels[st] || "Not marked"}</span></li>`).join("");
}

/* ---------- Navigation by role ---------- */
function applyRole() {
  document.querySelectorAll("#nav a").forEach((a) => { a.hidden = !a.dataset.roles.split(" ").includes(role); });
  show();
}
function show() {
  const allowed = [...document.querySelectorAll("#nav a:not([hidden])")].map((a) => a.hash.slice(1));
  const id = allowed.includes(location.hash.slice(1)) ? location.hash.slice(1) : role === "guardian" ? "parent" : "advising";
  document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== id; });
  document.querySelectorAll("#nav a").forEach((a) => {
    a.hash.slice(1) === id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
}
window.addEventListener("hashchange", show);
$("#role").addEventListener("change", (e) => {
  role = e.target.value;
  user.role = role;
  try { sessionStorage.setItem("lw-user", JSON.stringify(user)); } catch {}
  history.replaceState(null, "", location.pathname);
  applyRole();
});
document.querySelectorAll(".logout-link").forEach((l) => l.addEventListener("click", () => { try { sessionStorage.removeItem("lw-user"); } catch {} }));

/* ---------- Start ---------- */
const hr = new Date().getHours();
const first = (user.name || "").trim().split(" ")[0];
$("#hello").textContent = `${hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening"}${first ? ", " + first : ""}`;
$("#today").textContent = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
$("#role").value = role;
renderAdvisors(); renderSessions(); renderTutors(); renderAttendance(); renderParent(); applyRole();