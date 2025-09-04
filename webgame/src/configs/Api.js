import axios from "axios";


export const BASE_URL ="http://localhost:8000/";

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
  'categories': "categories/",
  'tags': "tags/",
  'orders': "orders/",
  'paymentsMomo': "payments/momo/",
  'paymentsVnpay': 'payments/vnpay/',
  'gameDownload': (id) => `games/${id}/download/`,
  'reviews': 'reviews/',
  'createReview': 'reviews/create_review/',
  'carts': 'carts/',
  'statsRevenue': "stats/revenue/",
  
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

// Lấy danh sách game với filter
export const getGames = async (params) => {
  return api.get(endpoints.games, { params });
};

// Lấy tags
export const getTags = async () => {
  return api.get(endpoints.tags);
};

// Tạo đơn hàng từ danh sách game_ids
export const createOrder = async (gameIds) => {
  return authApi().post(endpoints.orders, { game_ids: gameIds });
};

// Tạo thanh toán MoMo cho order
export const createMomoPayment = async (orderId) => {
  const redirectUrl = `${window.location.origin}/thank-you`;
  return authApi().post(endpoints.paymentsMomo, { order_id: orderId, redirect_url: redirectUrl });
};

export const createVnpayPayment = async (orderId) => {
  const redirectUrl = `${window.location.origin}/thank-you`;
  return authApi().post(endpoints.paymentsVnpay, { order_id: orderId, redirect_url: redirectUrl });
};

// Kiểm tra và lấy link tải nếu đã mua
export const getDownloadLink = async (gameId) => {
  return authApi().get(endpoints.gameDownload(gameId));
};

// Lấy danh sách đánh giá theo game
export const getReviews = async (gameId) => {
  return api.get(endpoints.reviews, { params: { game_id: gameId } });
};

// Tạo đánh giá (cần đã mua)
export const createReviewApi = async ({ game, rating, comment }) => {
  return authApi().post(endpoints.createReview, { game, rating, comment });
};
// Lấy giỏ hàng
export const getCartItems = async () => {
  return authApi().get(`${endpoints.carts}items/`);
};

// Thêm game vào giỏ hàng
export const addToCart = async (gameId) => {
  return authApi().post(`${endpoints.carts}add_item/`, { game_id: gameId });
};

// Xóa 1 game khỏi giỏ hàng
export const removeFromCart = async (gameId) => {
  return authApi().delete(`${endpoints.carts}remove_item/`, { data: { game_id: gameId } });
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async () => {
  return authApi().delete(`${endpoints.carts}clear/`);
};

export const getCategories = async () => {
  return api.get(endpoints.categories);
};
export const getRevenueStats = async (type = "month") => {
  return authApi().get(`${endpoints.statsRevenue}?type=${type}`);
};

// Lấy tất cả thống kê (revenue, category, tag, số lượng)
export const getAllStats = async () => {
  const token = localStorage.getItem("access_token");
  return axios.get(`${BASE_URL}${endpoints.statsRevenue}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};
export default api;
