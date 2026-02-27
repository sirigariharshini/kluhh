
const BACKEND_URL = 'http://localhost:3000';
const RPPG_URL = 'http://localhost:8001';

// Public development proxy
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

export interface ServiceStatus {
  ok: boolean;
  message: string;
  errorType?: 'CORS' | 'DOWN' | '404' | 'UNKNOWN';
  rawError?: string;
  latency?: number;
  simulated?: boolean;
  usingProxy?: boolean;
}

export const localServices = {
  async checkHealth(forceSimulate: boolean = false, useProxy: boolean = false): Promise<{ backend: ServiceStatus, rppg: ServiceStatus }> {
    if (forceSimulate) {
      return {
        backend: { ok: true, message: 'Simulated', simulated: true },
        rppg: { ok: true, message: 'Simulated', simulated: true }
      };
    }

    const check = async (url: string): Promise<ServiceStatus> => {
      // NOTE: Public proxies cannot see localhost. This only works if URLs are public.
      const targetUrl = useProxy ? `${CORS_PROXY}${url}` : url;
      const start = Date.now();
      try {
        const res = await fetch(targetUrl, {
          mode: 'cors',
          cache: 'no-cache',
          headers: useProxy ? { 'X-Requested-With': 'XMLHttpRequest' } : {}
        });
        const latency = Date.now() - start;
        return { ok: res.ok, message: res.ok ? 'Connected' : `Error ${res.status}`, latency, usingProxy: useProxy };
      } catch (e: any) {
        return { ok: false, message: 'Network Error', errorType: 'CORS', rawError: e.toString() };
      }
    };

    const [backend, rppg] = await Promise.all([
      check(`${BACKEND_URL}/api/health`),
      check(`${RPPG_URL}/health`)
    ]);

    return { backend, rppg };
  }
};
