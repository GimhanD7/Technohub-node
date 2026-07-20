const isDevelopment = process.env.NODE_ENV === "development";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
  : isDevelopment
    ? "http://localhost:5000"
    : "https://technohub.lk";

export const API_BASE_URL = `${BASE_URL}/api`;

const toastCooldownMs = 1200;
let lastToast = { key: "", time: 0 };

function shouldShowToast(key) {
  const now = Date.now();

  if (lastToast.key === key && now - lastToast.time < toastCooldownMs) {
    return false;
  }

  lastToast = { key, time: now };
  return true;
}

async function showApiToast(type, message, toastId) {
  if (typeof window === "undefined" || !message) {
    return;
  }

  const key = `${type}:${toastId || message}`;

  if (!shouldShowToast(key)) {
    return;
  }

  const { toast } = await import("react-hot-toast");
  const options = toastId ? { id: toastId } : undefined;

  if (type === "success") {
    toast.success(message, options);
    return;
  }

  toast.error(message, options);
}

function getFallbackErrorMessage(response) {
  if (response.status === 401) {
    return "Please login again to continue.";
  }

  if (response.status === 403) {
    return "You do not have permission to do this action.";
  }

  if (response.status === 404) {
    return "The requested information could not be found.";
  }

  if (response.status >= 500) {
    return "Server error. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
}

export async function fetchApi(endpoint, options = {}) {
  const {
    showToast,
    successMessage,
    errorMessage,
    toastId,
    headers,
    ...fetchOptions
  } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const shouldToastSuccess = showToast === true || (showToast !== false && method !== "GET");
  const shouldToastError = showToast !== false;

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
    });

    let data;

    try {
      data = await response.json();
    } catch {
      data = {
        success: response.ok,
        message: response.ok ? "Action completed successfully." : getFallbackErrorMessage(response),
      };
    }

    const isSuccess = response.ok && data?.success !== false;

    if (isSuccess && shouldToastSuccess) {
      void showApiToast("success", successMessage || data?.message || "Action completed successfully.", toastId);
    }

    if (!isSuccess && shouldToastError) {
      void showApiToast("error", errorMessage || data?.message || getFallbackErrorMessage(response), toastId);
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    const message = errorMessage || "Network error. Please try again.";

    if (shouldToastError) {
      void showApiToast("error", message, toastId);
    }

    return {
      success: false,
      message,
    };
  }
}
