let _url: string | null = null;
let _key: string | null = null;

function getConfig() {
  if (_url && _key) return { url: _url, key: _key };
  _url = process.env.SUPABASE_URL;
  _key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!_url || !_key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured');
  }
  return { url: _url, key: _key };
}

// ============================================================
// REST API helpers for Supabase
// ============================================================

interface SupabaseQueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number;
}

export async function supabaseSelect<T>(
  table: string,
  options: {
    select?: string;
    filters?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    head?: boolean;
    count?: 'exact' | 'planned' | 'estimated';
  } = {},
): Promise<SupabaseQueryResult<T[]>> {
  const { url, key } = getConfig();
  const params = new URLSearchParams();

  if (options.select) params.set('select', options.select);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.head) params.set('head', 'true');
  if (options.count) params.set('count', options.count);

  // Filters as query params (eq, gte, lt, etc.)
  if (options.filters) {
    for (const [k, v] of Object.entries(options.filters)) {
      if (v === null || v === undefined) continue;
      if (typeof v === 'object' && v !== null) {
        // Operator: { eq: 5 } -> =eq.5
        for (const [op, val] of Object.entries(v as Record<string, unknown>)) {
          if (val !== undefined && val !== null) {
            params.set(k, `${op}.${val}`);
          }
        }
      } else {
        params.set(k, `eq.${v}`);
      }
    }
  }

  if (options.order) {
    const dir = options.order.ascending === false ? 'desc' : 'asc';
    params.set('order', `${options.order.column}.${dir}`);
  }

  const queryStr = params.toString();
  const endpoint = `${url}/rest/v1/${table}${queryStr ? '?' + queryStr : ''}`;

  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': options.head ? 'return=minimal' : (options.count ? `count=${options.count}` : 'return=representation'),
  };

  const res = await fetch(endpoint, { headers });
  const text = await res.text();

  if (!res.ok) {
    return { data: null, error: { message: text, code: String(res.status) } };
  }

  if (options.head || res.status === 204) {
    const countHeader = res.headers.get('content-range');
    return {
      data: [],
      error: null,
      count: countHeader ? parseInt(countHeader.split('/')[1]) : undefined,
    };
  }

  try {
    const data = JSON.parse(text);
    return { data: Array.isArray(data) ? data : [data], error: null };
  } catch {
    return { data: null, error: { message: 'Invalid JSON response' } };
  }
}

export async function supabaseUpsert<T>(
  table: string,
  data: Record<string, unknown> | Record<string, unknown>[],
  options: {
    onConflict?: string;
    select?: string;
  } = {},
): Promise<SupabaseQueryResult<T[]>> {
  const { url, key } = getConfig();
  const params = new URLSearchParams();

  if (options.onConflict) params.set('on_conflict', options.onConflict);
  if (options.select) params.set('select', options.select);

  const queryStr = params.toString();
  const endpoint = `${url}/rest/v1/${table}${queryStr ? '?' + queryStr : ''}`;

  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation,resolution=merge-duplicates',
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();

  if (!res.ok) {
    return { data: null, error: { message: text, code: String(res.status) } };
  }

  try {
    const result = JSON.parse(text);
    return { data: Array.isArray(result) ? result : [result], error: null };
  } catch {
    return { data: [], error: null };
  }
}

export async function supabaseUpdate<T>(
  table: string,
  data: Record<string, unknown>,
  filters: Record<string, unknown>,
): Promise<SupabaseQueryResult<T[]>> {
  const { url, key } = getConfig();
  const params = new URLSearchParams();

  for (const [k, v] of Object.entries(filters)) {
    if (v !== null && v !== undefined) {
      params.set(k, `eq.${v}`);
    }
  }

  const queryStr = params.toString();
  const endpoint = `${url}/rest/v1/${table}${queryStr ? '?' + queryStr : ''}`;

  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();

  if (!res.ok) {
    return { data: null, error: { message: text, code: String(res.status) } };
  }

  try {
    const result = JSON.parse(text);
    return { data: Array.isArray(result) ? result : [result], error: null };
  } catch {
    return { data: [], error: null };
  }
}

export async function supabaseDelete(
  table: string,
  filters: Record<string, unknown>,
): Promise<{ error: { message: string; code?: string } | null }> {
  const { url, key } = getConfig();
  const params = new URLSearchParams();

  for (const [k, v] of Object.entries(filters)) {
    if (v !== null && v !== undefined) {
      params.set(k, `eq.${v}`);
    }
  }

  const queryStr = params.toString();
  const endpoint = `${url}/rest/v1/${table}${queryStr ? '?' + queryStr : ''}`;

  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  const res = await fetch(endpoint, { method: 'DELETE', headers });

  if (!res.ok) {
    const text = await res.text();
    return { error: { message: text, code: String(res.status) } };
  }

  return { error: null };
}

export async function supabaseInsert<T>(
  table: string,
  data: Record<string, unknown> | Record<string, unknown>[],
  options: { select?: string } = {},
): Promise<SupabaseQueryResult<T[]>> {
  const { url, key } = getConfig();
  const params = new URLSearchParams();
  if (options.select) params.set('select', options.select);

  const queryStr = params.toString();
  const endpoint = `${url}/rest/v1/${table}${queryStr ? '?' + queryStr : ''}`;

  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const text = await res.text();

  if (!res.ok) {
    return { data: null, error: { message: text, code: String(res.status) } };
  }

  try {
    const result = JSON.parse(text);
    return { data: Array.isArray(result) ? result : [result], error: null };
  } catch {
    return { data: [], error: null };
  }
}

// Simple health check
export async function supabaseHealthCheck(): Promise<boolean> {
  try {
    const { url, key } = getConfig();
    const res = await fetch(`${url}/rest/v1/?limit=0`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
