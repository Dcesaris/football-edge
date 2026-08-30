import { jsonResponse, handleCORS } from './utils';

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  return jsonResponse({
    apiFootballConfigured: !!process.env.API_FOOTBALL_KEY,
    nvidiaConfigured: !!process.env.NVIDIA_API_KEY,
  });
}
