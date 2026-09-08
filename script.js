const form = document.getElementById("registrationForm");
const registerBtn = document.getElementById("registerBtn");
const successModal = document.getElementById("successModal");
const doneBtn = document.getElementById("doneBtn");
const errorToast = document.getElementById("errorToast");

const fullName = document.getElementById("fullName");
const gender = document.getElementById("gender");
const phone = document.getElementById("phone");

const nameError = document.getElementById("nameError");
const genderError = document.getElementById("genderError");
const phoneError = document.getElementById("phoneError");

/*
  DEMO STORAGE:
  This version uses localStorage so the page works immediately without a backend.
  For a real event deployed publicly, replace saveRegistration() with a server/API
  or Supabase database implementation. localStorage is NOT shared between devices.
*/

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizePhone(value) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("234")) {
    return "+" + digits;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return "+234" + digits.slice(1);
  }

  return "+" + digits;
}

function getRegistrations() {
  try {
    return JSON.parse(localStorage.getItem("patfitnessRegistrations") || "[]");
  } catch {
    return [];
  }
}

function saveRegistration(registration) {
  const registrations = getRegistrations();

  const duplicate = registrations.some(item =>
    item.normalizedName === registration.normalizedName &&
    item.normalizedPhone === registration.normalizedPhone
  );

  if (duplicate) {
    return { ok: false, duplicate: true };
  }

  registrations.push(registration);
  localStorage.setItem("patfitnessRegistrations", JSON.stringify(registrations));

  return { ok: true };
}

function clearErrors() {
  nameError.textContent = "";
  genderError.textContent = "";
  phoneError.textContent = "";
}

function validate() {
  clearErrors();
  let valid = true;

  if (fullName.value.trim().length < 2) {
    nameError.textContent = "Please enter your full name.";
    valid = false;
  }

  if (!gender.value) {
    genderError.textContent = "Please select your gender.";
    valid = false;
  }

  const normalized = normalizePhone(phone.value);

  if (!/^\+234\d{10}$/.test(normalized)) {
    phoneError.textContent = "Please enter a valid Nigerian phone number.";
    valid = false;
  }

  return valid;
}

function showToast(message) {
  errorToast.textContent = message;
  errorToast.classList.add("show");
  setTimeout(() => errorToast.classList.remove("show"), 3500);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validate()) return;

  registerBtn.disabled = true;
  registerBtn.classList.add("loading");

  // Simulates the small network delay a real backend would have.
  await new Promise(resolve => setTimeout(resolve, 350));

  const normalizedName = normalizeName(fullName.value);
  const normalizedPhone = normalizePhone(phone.value);

  const result = saveRegistration({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fullName: fullName.value.trim().replace(/\s+/g, " "),
    normalizedName,
    gender: gender.value,
    phone: normalizedPhone,
    normalizedPhone,
    registeredAt: new Date().toISOString()
  });

  registerBtn.disabled = false;
  registerBtn.classList.remove("loading");

  if (!result.ok && result.duplicate) {
    showToast("This name and phone number have already been registered.");
    return;
  }

  if (!result.ok) {
    showToast("Something went wrong while submitting your registration.");
    return;
  }

  form.reset();
  successModal.hidden = false;
  doneBtn.focus();
});

doneBtn.addEventListener("click", () => {
  successModal.hidden = true;
  fullName.focus();
});

successModal.addEventListener("click", (event) => {
  if (event.target === successModal) {
    successModal.hidden = true;
  }
});
