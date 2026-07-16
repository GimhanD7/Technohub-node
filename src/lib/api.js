const isDevelopment = process.env.NODE_ENV === 'development';
export const BASE_URL = isDevelopment ? "http://localhost:5000" : "https://technohub.kasunwalakumbura.com";
export const API_BASE_URL = `${BASE_URL}/api`;

export async function fetchApi(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: "Network error. Is the Node.js backend running on port 5000?" };
  }
}
