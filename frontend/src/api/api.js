const API_BASE_URL = "http://127.0.0.1:8000";

// ============================================================
// GENERIC API REQUEST
// ============================================================

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("threatlens_token");

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message = "Something went wrong.";

    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map(
            (error) =>
              error.msg || "Invalid request."
          )
          .join(" ");
      } else if (
        typeof data.detail === "object"
      ) {
        message =
          data.detail.message ||
          data.detail.error ||
          "Something went wrong.";
      }
    }

    const error = new Error(message);

    // Preserve HTTP status
    error.status = response.status;

    // Preserve complete backend response
    error.data = data;

    // Preserve backend detail
    error.detail = data?.detail;

    // Extract existing file ID from duplicate-upload response
    error.fileId =
      data?.file_id ??
      data?.detail?.file_id ??
      data?.detail?.existing_file_id ??
      null;

    throw error;
  }

  return data;
}

// ============================================================
// LOGIN
// ============================================================

export async function loginUser(
  email,
  password
) {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      password,
    }),
  });
}

// ============================================================
// REGISTER
// ============================================================

export async function registerUser({
  email,
  username,
  full_name,
  password,
}) {
  return apiRequest("/api/v1/auth/register", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      username,
      full_name,
      password,
    }),
  });
}

// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser() {
  return apiRequest(
    "/api/v1/auth/profile"
  );
}

// ============================================================
// UPDATE USER PROFILE
// ============================================================

export async function updateUserProfile({
  full_name,
  email,
}) {
  return apiRequest(
    "/api/v1/auth/profile",
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        full_name,
        email,
      }),
    }
  );
}

// ============================================================
// LOGOUT
// ============================================================

export function logoutUser() {
  localStorage.removeItem(
    "threatlens_token"
  );
}

// ============================================================
// UPLOAD FILE
// ============================================================

export async function uploadFile(file) {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest("/upload/", {
    method: "POST",
    body: formData,
  });
}

// ============================================================
// ANALYZE FILE
// ============================================================

export async function analyzeFile(fileId) {
  return apiRequest(
    `/analysis/${fileId}`,
    {
      method: "POST",
    }
  );
}

// ============================================================
// ANALYSIS HISTORY
// ============================================================

export async function getAnalysisHistory() {
  return apiRequest(
    "/analysis/history",
    {
      method: "GET",
    }
  );
}

// ============================================================
// ALERTS
// ============================================================

export async function getAlerts() {
  return apiRequest("/alerts", {
    method: "GET",
  });
}

// ============================================================
// ACKNOWLEDGE ALERT
// ============================================================

export async function acknowledgeAlert(
  alertId
) {
  return apiRequest(
    `/alerts/${alertId}/acknowledge`,
    {
      method: "PATCH",
    }
  );
}

// ============================================================
// SINGLE ANALYSIS
// ============================================================

export async function getAnalysis(fileId) {
  return apiRequest(
    `/analysis/${fileId}`,
    {
      method: "GET",
    }
  );
}