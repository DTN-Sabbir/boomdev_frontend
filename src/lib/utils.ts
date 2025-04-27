import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const localBaseUrl = process.env.NEXT_PUBLIC_LOCAL_BASE_URL;

const api = axios.create({
  baseURL: localBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const isTokenExpired = (token: string) => {
  if (!token) return true; // Token is not provided
  if (token === "undefined") return true; // Token is undefined
  try {
    const decodedToken: any = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // If there's an error, consider the token expired
  }
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null; // No refresh token available

  try {
    const response = await api.post(`${localBaseUrl}/api/v1/refresh/`, {
      refresh: refreshToken,
    });
    const newAccessToken = response.data.access;
    localStorage.setItem("accessToken", newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null; // If there's an error, return null
  }
};

api.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (isTokenExpired(accessToken || "")) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        config.headers["Authorization"] = `Bearer ${newAccessToken}`;
      }
    } else {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
