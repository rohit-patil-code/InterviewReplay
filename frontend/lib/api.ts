import axios from "axios";

const API_Base_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
    baseURL: API_Base_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;

export const authApi = {
    // Login
    loginSendOtp: (email: string) => api.post("/auth/login/send-otp", { email }),
    loginVerifyOtp: (email: string, otp: string) => api.post("/auth/login/verify-otp", { email, otp }),

    // Register
    registerSendOtp: (email: string) => api.post("/auth/register/send-otp", { email }),
    registerVerifyOtp: (email: string, otp: string, firstName: string, lastName: string) =>
        api.post("/auth/register/verify-otp", { email, otp, firstName, lastName }),

    // Google
    googleLogin: (token: string) => api.post("/auth/google", { token }),

    // User
    getMe: () => api.get("/auth/me"),

    // Logout
    logout: () => api.post("/auth/logout"),

    // Problems
    createProblem: (data: any) => api.post("/problems", data),
    getProblems: () => api.get("/problems"),
    deleteProblem: (id: string) => api.delete(`/problems/${id}`),
};
