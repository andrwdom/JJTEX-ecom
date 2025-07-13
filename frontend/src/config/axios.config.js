npimport axios from 'axios';

axios.defaults.withCredentials = true;

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Clear invalid token
            localStorage.removeItem('token');
            // Redirect to login if needed
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance; 