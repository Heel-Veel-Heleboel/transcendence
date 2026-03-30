import axios from 'axios';
import { CONFIG } from '../config/AppConfig';
import { configure } from 'axios-hooks';
import { LRUCache } from 'lru-cache/raw';

const api = axios.create({
  baseURL: CONFIG.REQUEST_BASE_URL,
  withCredentials: true
});

const cache = new LRUCache({ max: 10 });
configure({ axios: api, cache });

export default api;
