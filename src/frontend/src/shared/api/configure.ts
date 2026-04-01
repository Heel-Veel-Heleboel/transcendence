import { AxiosInstance } from 'axios';
import { configure, makeUseAxios } from 'axios-hooks';
import { LRUCache } from 'lru-cache/raw';

export function configureApi(axios: AxiosInstance) {
  const cache = new LRUCache({ max: 10 });
  return makeUseAxios({ axios, cache });
}
