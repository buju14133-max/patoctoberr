const SUPABASE_URL = "https://svkwjbmnilzhtbnntqdf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JROamTuPH4tcdTcVffPodA_oT4byHqE";
const ADMIN_TOKEN = "iDCU0vXvJMxVAXPtN1Lb2yJUl7aKaB-pF1rG7DLlF-8";
const LIST_RPC = `${SUPABASE_URL}/rest/v1/rpc/admin_list_registrations`;
const DELETE_RPC = `${SUPABASE_URL}/rest/v1/rpc/admin_delete_registration`;

const total = document.getElementById("total");
const tableBody = document.getElementById("tableBody");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const exportBtn = document.getElementById("exportBtn");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const refreshStatus = document.getElementById("refreshStatus");

let registrations = [];
let loading = false;

function apiHeaders() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json"
  };
}

async function callRpc(endpoint, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body)
  });
  let data = null;
  try { data = await response.json(); } catch { /* no-op */ }
  if (!response.ok) throw new Error(data?.message || data?.error || "Request failed");
  return data;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}

async function loadRegistrations(silent = false) {
  if (loading) return;
  loading = true;
  if (!silent) refreshStatus.textContent = "Loading…";

  try {
    const data = await callRpc(LIST_RPC, { p_token: ADMIN_TOKEN });
    registrations = Array.isArray(data) ? data : [];
    render();
    refreshStatus.textContent = `Live • Updated ${new Date().toLocaleTimeString("en-NG", {hour:"2-digit", minute:"2-digit", second:"2-digit"})}`;
  } catch (error) {
    refreshStatus.textContent = "Connection error — retrying…";
    console.error(error);
  } finally {
    loading = false;
  }
}

function filteredRows() {
  const query = search.value.trim().toLowerCase();
  const selectedGender = filter.value;

  return registrations.filter(item => {
    const matchesSearch = !query ||
      String(item.full_name || "").toLowerCase().includes(query) ||
      String(item.phone_number || "").toLowerCase().includes(query);
    const matchesGender = selectedGender === "All" || item.gender === selectedGender;
    return matchesSearch && matchesGender;
  }).sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
}

function render() {
  total.textContent = registrations.length;
  const rows = filteredRows();
  tableBody.innerHTML = "";
  empty.style.display = rows.length ? "none" : "block";

  rows.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.full_name)}</td>
      <td>${escapeHtml(item.gender)}</td>
      <td>${escapeHtml(item.phone_number)}</td>
      <td>${escapeHtml(formatDate(item.registered_at))}</td>
      <td><button class="delete" data-id="${escapeHtml(item.id)}">Delete</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener("click", async event => {
  const button = event.target.closest(".delete");
  if (!button) return;
  const id = button.dataset.id;
  if (!confirm("Delete this registration? This cannot be undone.")) return;

  button.disabled = true;
  try {
    await callRpc(DELETE_RPC, { p_token: ADMIN_TOKEN, p_id: id });
    await loadRegistrations();
  } catch (error) {
    alert("Could not delete this registration. Please try again.");
    button.disabled = false;
    console.error(error);
  }
});

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportRows() {
  return filteredRows().map(item => [
    item.full_name,
    item.gender,
    item.phone_number,
    formatDate(item.registered_at)
  ]);
}

exportBtn.addEventListener("click", () => {
  const header = ["Full Name", "Gender", "Phone Number", "Registration Date/Time"];
  const csv = [header, ...exportRows()]
    .map(row => row.map(csvEscape).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "patfitness-registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
});

exportExcelBtn.addEventListener("click", () => {
  if (!window.XLSX) {
    alert("Excel export library is still loading. Please try again.");
    return;
  }
  const rows = [
    ["Full Name", "Gender", "Phone Number", "Registration Date/Time"],
    ...exportRows()
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 20 }, { wch: 28 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Registrations");
  XLSX.writeFile(book, "patfitness-registrations.xlsx");
});

search.addEventListener("input", render);
filter.addEventListener("change", render);

loadRegistrations();
setInterval(() => loadRegistrations(true), 3000);
