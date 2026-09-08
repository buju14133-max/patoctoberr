const total = document.getElementById("total");
const tableBody = document.getElementById("tableBody");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const exportBtn = document.getElementById("exportBtn");

function getRegistrations() {
  try {
    return JSON.parse(localStorage.getItem("patfitnessRegistrations") || "[]");
  } catch {
    return [];
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}

function render() {
  const all = getRegistrations();
  total.textContent = all.length;

  const query = search.value.trim().toLowerCase();
  const selectedGender = filter.value;

  const rows = all.filter(item => {
    const matchesSearch =
      !query ||
      item.fullName.toLowerCase().includes(query) ||
      item.phone.toLowerCase().includes(query);

    const matchesGender =
      selectedGender === "All" || item.gender === selectedGender;

    return matchesSearch && matchesGender;
  }).sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt));

  tableBody.innerHTML = "";
  empty.style.display = rows.length ? "none" : "block";

  rows.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.fullName)}</td>
      <td>${escapeHtml(item.gender)}</td>
      <td>${escapeHtml(item.phone)}</td>
      <td>${escapeHtml(formatDate(item.registeredAt))}</td>
      <td><button class="delete" data-id="${escapeHtml(item.id)}">Delete</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener("click", event => {
  const button = event.target.closest(".delete");
  if (!button) return;

  const id = button.dataset.id;
  if (!confirm("Delete this registration?")) return;

  const updated = getRegistrations().filter(item => item.id !== id);
  localStorage.setItem("patfitnessRegistrations", JSON.stringify(updated));
  render();
});

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

exportBtn.addEventListener("click", () => {
  const rows = getRegistrations();
  const header = ["Full Name","Gender","Phone Number","Registration Date/Time"];

  const csv = [
    header,
    ...rows.map(item => [
      item.fullName,
      item.gender,
      item.phone,
      formatDate(item.registeredAt)
    ])
  ].map(row => row.map(csvEscape).join(",")).join("\n");

  const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "patfitness-registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
});

search.addEventListener("input", render);
filter.addEventListener("change", render);

window.addEventListener("storage", render);
setInterval(render, 1500);
render();
