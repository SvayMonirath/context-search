import { api } from "./global.api";
import { toast } from "react-toastify";

export const API_BASE_URL = "/authentication";

export const registerAPI = async (username, email, hash_password, confirm_password) => {
  try {
    const response = await api.post(`${API_BASE_URL}/register`, {
      username: username,
      email: email,
      hash_password: hash_password,
      confirm_password: confirm_password,
    });

    console.log("(API) Registration successful:", response.data);
    toast.success(response.data.message || "Registration successful!");

    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Registration failed. Please try again.";
    console.error("(API) Registration failed:", message);
    toast.error(message);
    return { status: "error", message };
  }
}

export const loginAPI = async (email, password) => {
  try {
    const response = await api.post(`${API_BASE_URL}/login`, {
      email: email,
      password: password,
    });

    toast.success(response.data.message || "Login successful!");
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Login failed. Please try again.";
    console.error("(API) Login failed:", message);
    toast.error(message);
    return { status: "error", message };
  }
}

export const logoutAPI = async () => {
  try {
    const response = await api.post(`${API_BASE_URL}/logout`);
    toast.success(response.data.message || "Logout successful!");
    console.log("(API) Logout successful:", response.data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Logout failed. Please try again.";
    console.error("(API) Logout failed:", message);
    return { status: "error", message };
  }
}

export const checkAuthAPI = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/me`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Authentication check failed.";
    console.error("(API) Auth check failed:", error);
    return { status: "error", message };
  }
}
