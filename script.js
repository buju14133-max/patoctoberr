const SUPABASE_URL = "https://svkwjbmnjlzhtbnntqdf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JROamTuPH4tcdTcVffPodA_oT4byHqE";
const REGISTER_RPC = `${SUPABASE_URL}/rest/v1/rpc/register_participant`;

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

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return "+" + digits;
  if (digits.startsWith("0") && digits.length === 11) return "+234" + digits.slice(1);
  return "+" + digits;
}

function clearErrors() {
  nameError.textContent = "";
  genderError.textContent = "";
  phoneError.textContent = "";
}

function validate() {
  clearErrors();
  let valid = true;
  const name = fullName.value.trim().replace(/\s+/g, " ");
  const normalized = normalizePhone(phone.value);

  if (name.length < 2) {
    nameError.textContent = "Please enter your full name.";
    valid = false;
  }

  if (!gender.value) {
    genderError.textContent = "Please select your gender.";
    valid = false;
  }

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

async function submitRegistration() {
  const payload = {
    p_full_name: fullName.value.trim().replace(/\s+/g, " "),
    p_gender: gender.value,
    p_phone: phone.value.trim()
  };

  const response = await fetch(REGISTER_RPC, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  let data = null;
  try { data = await response.json(); } catch { /* no-op */ }

  if (!response.ok) {
    const message = data?.message || data?.error || "Something went wrong while submitting your registration.";
    throw new Error(message);
  }

  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validate()) return;

  registerBtn.disabled = true;
  registerBtn.classList.add("loading");

  try {
    const result = await submitRegistration();

    if (result?.duplicate) {
      showToast("This name and phone number have already been registered.");
      return;
    }

    if (!result?.success) {
      showToast(result?.message || "Something went wrong while submitting your registration.");
      return;
    }

    form.reset();
    successModal.hidden = false;
    doneBtn.focus();
  } catch (error) {
    const message = String(error?.message || "");
    if (/already|duplicate|unique/i.test(message)) {
      showToast("This name and phone number have already been registered.");
    } else if (/valid Nigerian phone|phone number/i.test(message)) {
      phoneError.textContent = "Please enter a valid Nigerian phone number.";
    } else if (/full name/i.test(message)) {
      nameError.textContent = "Please enter your full name.";
    } else if (/gender/i.test(message)) {
      genderError.textContent = "Please select your gender.";
    } else {
      showToast("Unable to submit right now. Please try again.");
      console.error(error);
    }
  } finally {
    registerBtn.disabled = false;
    registerBtn.classList.remove("loading");
  }
});

doneBtn.addEventListener("click", () => {
  successModal.hidden = true;
  fullName.focus();
});

successModal.addEventListener("click", (event) => {
  if (event.target === successModal) successModal.hidden = true;
});
