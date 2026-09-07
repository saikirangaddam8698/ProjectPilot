/**
 * ProjectPilot Centralized HTTP API Client
 */
const BASE_URL = '/api/v1';

export class ApiClientError extends Error {
  constructor(message, { code = 'API_ERROR', status = 500, details = null } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, { method = 'GET', body = null, params = null, headers = {} } = {}) {
  let url = `${BASE_URL}${endpoint}`;

  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const fetchOptions = {
    method,
    credentials: 'include', // Automatically send and receive HTTP-only cookies
    headers: {
      'Accept': 'application/json',
      ...headers
    }
  };

  if (body) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    let json = null;
    try {
      json = await response.json();
    } catch {
      // Non-JSON response
    }

    if (!response.ok) {
      const errorObj = json?.error || {};
      const errorMessage = errorObj.message || json?.message || `Request failed with status ${response.status}`;
      
      // Notify application if session has expired (401 Unauthorized on non-login endpoints)
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('projectpilot:session-expired', {
            detail: { message: errorMessage, endpoint }
          }));
        }
      }

      throw new ApiClientError(errorMessage, {
        code: errorObj.code || 'HTTP_ERROR',
        status: response.status,
        details: errorObj.details || null
      });
    }

    // Return data from standardized success structure
    return json?.data !== undefined ? json.data : json;
  } catch (err) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    // Network / fetch error
    throw new ApiClientError(err.message || 'Network error connecting to ProjectPilot server', {
      code: 'NETWORK_ERROR',
      status: 0,
      details: null
    });
  }
}

export const httpClient = {
  get: (endpoint, params = null, headers = {}) => request(endpoint, { method: 'GET', params, headers }),
  post: (endpoint, body = null, headers = {}) => request(endpoint, { method: 'POST', body, headers }),
  patch: (endpoint, body = null, headers = {}) => request(endpoint, { method: 'PATCH', body, headers }),
  put: (endpoint, body = null, headers = {}) => request(endpoint, { method: 'PUT', body, headers }),
  delete: (endpoint, headers = {}) => request(endpoint, { method: 'DELETE', headers })
};

export const http = httpClient;
