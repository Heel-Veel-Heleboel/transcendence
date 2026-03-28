import axios from 'axios';
import { CONFIG } from '../config/AppConfig';

const api = axios.create({
  baseURL: CONFIG.REQUEST_BASE_URL,
  withCredentials: true
});

export default api;
