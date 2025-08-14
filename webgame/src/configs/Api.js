import axios from "axios";

// Lấy URL từ file .env (ví dụ: REACT_APP_BASE_URL=http://localhost:8000/)
export const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:8000/";

// Tạo axios instance cho API public (không cần token)
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Danh sách endpoints
export const endpoints = {
  'login': "users/login/",
  'currentUser': "users/current_user/",
  'register': "users/",
  'games': "games/",
  'gameDetail': (id) => `games/${id}/`,

};

// API cho request cần token
export const authApi = () => {
  const token = localStorage.getItem("access_token");
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};

// Hàm get ảnh (nếu ảnh là đường dẫn tương đối)
export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

// Interceptor xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error.message);
    return Promise.reject(error);
  }
);

// Đăng ký tài khoản: gửi FormData vì backend chỉ parse multipart
export const registerAccount = async ({ email, username, password, phone_number, first_name, last_name, avatar, role }) => {
  const form = new FormData();
  if (email) form.append('email', email);
  if (username) form.append('username', username);
  if (password) form.append('password', password);
  if (phone_number) form.append('phone_number', phone_number);
  if (first_name) form.append('first_name', first_name);
  if (last_name) form.append('last_name', last_name);
  if (role) form.append('role', role);
  if (avatar) form.append('avatar', avatar);

  return axios.post(`${BASE_URL}${endpoints.register}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Đăng nhập: gọi /users/login/ trả về {access, refresh}
export const loginUser = async ({ username, password }) => {
  return api.post(endpoints.login, { username, password });
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async () => {
  return authApi().get(endpoints.currentUser);
};

export default api;
