const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("clinicflow_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  listDoctors: (params = "") => request(`/doctors${params}`),
  getDoctor: (id) => request(`/doctors/${id}`),
  createDoctor: (payload) => request("/doctors", { method: "POST", body: payload }),
  getDoctorSchedule: (id, date) => request(`/doctors/${id}/schedule?date=${date}`),

  listPatients: (params = "") => request(`/patients${params}`),
  createPatient: (payload) => request("/patients", { method: "POST", body: payload }),

  listAppointments: (params = "") => request(`/appointments${params}`),
  createAppointment: (payload) => request("/appointments", { method: "POST", body: payload }),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: "PATCH" }),
};

export { getToken };
