const isDevelopment = process.env.NODE_ENV === "development";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
  : isDevelopment
    ? "http://localhost:5000"
    : "https://technohub.lk";

export const API_BASE_URL = `${BASE_URL}/api`;

export async function fetchApi(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);

    return {
      success: false,
      message: "Network error. Please try again.",
    };
  }
}
