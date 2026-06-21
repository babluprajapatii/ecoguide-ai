import { BADGES } from '../../features/gamification/data/badges';

class InMemoryDB {
  private static store: Record<string, Record<string, unknown>[]> = {
    profiles: [
      {
        id: 'test-user-id',
        display_name: 'Green Pioneer',
        avatar_url: '',
        created_at: new Date().toISOString(),
      },
    ],
    user_points: [
      { user_id: 'test-user-id', total_points: 1200, current_level: 3, longest_streak: 5 },
    ],
    community_profiles: [
      {
        id: 'test-user-id',
        user_id: 'test-user-id',
        opt_in: true,
        leaderboard_opt_in: true,
        public_profile_visibility: 'public',
        bio: 'Living green!',
      },
    ],
    leaderboard_rank_cache: [
      {
        user_id: 'test-user-id',
        rank: 1,
        previous_rank: null,
        rank_change: 0,
        total_points: 1200,
        current_level: 3,
        longest_streak: 5,
        display_name: 'Green Pioneer',
        avatar_url: '',
        badge_count: 0,
        cached_at: new Date().toISOString(),
      },
    ],
    community_stats_cache: [],
    assessments: [],
    saved_simulations: [],
    goals: [],
    user_badges: [],
    points_transactions: [],
    badges: BADGES.map((b) => ({
      id: `badge-uuid-${b.slug}`,
      slug: b.slug,
      name: b.name,
      description: b.description,
      icon: b.icon,
      xp_reward: b.pointValue,
      unlock_condition: b.criteria,
      category: b.category,
      created_at: new Date().toISOString(),
    })),
  };

  static getTable(table: string): Record<string, unknown>[] {
    if (!this.store[table]) {
      this.store[table] = [];
    }
    return this.store[table]!;
  }
}

interface MockBuilder {
  select: (columns?: string, options?: { count?: string; head?: boolean }) => MockBuilder;
  eq: (column: string, value: unknown) => MockBuilder;
  neq: (column: string, value: unknown) => MockBuilder;
  gte: (column: string, value: unknown) => MockBuilder;
  lte: (column: string, value: unknown) => MockBuilder;
  order: (column: string, options?: { ascending?: boolean }) => MockBuilder;
  limit: (count: number) => MockBuilder;
  range: (from: number, to: number) => MockBuilder;
  insert: (values: unknown) => MockBuilder;
  update: (values: Record<string, unknown>) => MockBuilder;
  upsert: (values: unknown) => MockBuilder;
  delete: () => MockBuilder;
  then: <T = unknown>(onfulfilled?: (value: unknown) => T) => Promise<T>;
  single: () => Promise<{
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  }>;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: null }>;
}

function createMockBuilder(table: string): MockBuilder {
  let data = InMemoryDB.getTable(table);

  if (table === 'user_points' || table === 'assessments') {
    const profiles = InMemoryDB.getTable('profiles');
    const communityProfiles = InMemoryDB.getTable('community_profiles');
    data = data.map((row) => {
      const p = profiles.find((prof) => prof.id === row.user_id) || {
        id: row.user_id,
        display_name: 'Green Pioneer',
        avatar_url: '',
        created_at: new Date().toISOString(),
      };
      const cp = communityProfiles.find((cprof) => cprof.id === row.user_id) || {
        id: row.user_id,
        opt_in: true,
        leaderboard_opt_in: true,
        public_profile_visibility: 'public',
        bio: 'Living green!',
      };
      return {
        ...row,
        profiles: p,
        community_profiles: cp,
      };
    });
  }

  let filteredData = [...data];
  let countOnly = false;

  const builder: MockBuilder = {
    select: (_columns?: string, _options?: { count?: string; head?: boolean }) => {
      if (_options && _options.count === 'exact' && _options.head === true) {
        countOnly = true;
      }
      return builder;
    },
    eq: (column: string, value: unknown) => {
      filteredData = filteredData.filter((row) => row[column] === value);
      return builder;
    },
    neq: (column: string, value: unknown) => {
      filteredData = filteredData.filter((row) => row[column] !== value);
      return builder;
    },
    gte: (column: string, value: unknown) => {
      filteredData = filteredData.filter((row) => {
        const val = row[column];
        if (typeof val === 'string' && typeof value === 'string') {
          return val >= value;
        }
        if (typeof val === 'number' && typeof value === 'number') {
          return val >= value;
        }
        return false;
      });
      return builder;
    },
    lte: (column: string, value: unknown) => {
      filteredData = filteredData.filter((row) => {
        const val = row[column];
        if (typeof val === 'string' && typeof value === 'string') {
          return val <= value;
        }
        if (typeof val === 'number' && typeof value === 'number') {
          return val <= value;
        }
        return false;
      });
      return builder;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      filteredData.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        const asc = options?.ascending !== false;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }
        const strA = String(valA || '');
        const strB = String(valB || '');
        if (strA < strB) return asc ? -1 : 1;
        if (strA > strB) return asc ? 1 : -1;
        return 0;
      });
      return builder;
    },
    limit: (count: number) => {
      filteredData = filteredData.slice(0, count);
      return builder;
    },
    range: (from: number, to: number) => {
      filteredData = filteredData.slice(from, to + 1);
      return builder;
    },
    insert: (values: unknown) => {
      const rows = Array.isArray(values) ? values : [values];
      rows.forEach((r) => {
        const record = r as Record<string, unknown>;
        if (table === 'community_profiles') {
          if (!record.user_id && record.id) record.user_id = record.id;
          if (!record.id && record.user_id) record.id = record.user_id;
        }
        const uuid =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2);
        const newRow = { id: record.id || uuid, created_at: new Date().toISOString(), ...record };
        data.push(newRow);
        filteredData.push(newRow);
      });
      return builder;
    },
    update: (values: Record<string, unknown>) => {
      filteredData.forEach((row) => {
        Object.assign(row, values);
      });
      return builder;
    },
    upsert: (values: unknown) => {
      const rows = Array.isArray(values) ? values : [values];
      rows.forEach((r) => {
        const record = r as Record<string, unknown>;
        if (table === 'community_profiles') {
          if (!record.user_id && record.id) record.user_id = record.id;
          if (!record.id && record.user_id) record.id = record.user_id;
        }
        let index = -1;
        if (table === 'community_stats_cache') {
          index = data.findIndex((row) => row.id === 1 || row.id === '1');
        } else if (record.id) {
          index = data.findIndex((row) => row.id === record.id);
        } else if (record.user_id) {
          index = data.findIndex((row) => row.user_id === record.user_id);
        }

        if (index >= 0) {
          Object.assign(data[index]!, record);
          const fIndex = filteredData.findIndex(
            (row) => row.id === record.id || row.user_id === record.user_id,
          );
          if (fIndex >= 0) Object.assign(filteredData[fIndex]!, record);
        } else {
          const uuid =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2);
          const newRow = { id: record.id || uuid, created_at: new Date().toISOString(), ...record };
          data.push(newRow);
          filteredData.push(newRow);
        }
      });
      return builder;
    },
    delete: () => {
      filteredData.forEach((row) => {
        const index = data.indexOf(row);
        if (index >= 0) data.splice(index, 1);
      });
      filteredData = [];
      return builder;
    },
    then: <T = unknown>(onfulfilled?: (value: unknown) => T) => {
      const res = countOnly
        ? { data: null, error: null, count: filteredData.length }
        : { data: filteredData, error: null, count: filteredData.length };
      return Promise.resolve(onfulfilled ? onfulfilled(res) : (res as unknown as T));
    },
    single: () => {
      const res = {
        data: (filteredData[0] as Record<string, unknown>) || null,
        error: filteredData[0] ? null : { message: 'No rows found' },
      };
      return Promise.resolve(res);
    },
    maybeSingle: () => {
      const res = { data: filteredData[0] || null, error: null };
      return Promise.resolve(res);
    },
  };

  return builder;
}

const authSubscribers: Array<(event: string, session: unknown) => void> = [];
const mockStorageMap: Record<string, string> = {};

function getCookieVal(name: string): string | null {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match && match[2] ? decodeURIComponent(match[2]) : null;
  }
  try {
    const nextHeaders = eval('require')('next/headers');
    const store = nextHeaders.cookies();
    return store.get(name)?.value || null;
  } catch {
    return null;
  }
}

function setCookieVal(name: string, value: string | null) {
  if (typeof window !== 'undefined') {
    if (value === null) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    } else {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=604800;`;
    }
    return;
  }
  try {
    const nextHeaders = eval('require')('next/headers');
    const store = nextHeaders.cookies();
    if (value === null) {
      store.delete(name);
    } else {
      store.set(name, value, { path: '/', maxAge: 604800 });
    }
  } catch (err) {
    console.debug('Failed to set cookie in mock server context', err);
  }
}

function notifySubscribers(event: string, session: unknown) {
  authSubscribers.forEach((cb) => {
    try {
      cb(event, session);
    } catch (err) {
      console.warn('Failed to notify auth subscriber', err);
    }
  });
}

const defaultUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { display_name: 'Green Pioneer' },
};

export const mockSupabaseClient = {
  auth: {
    getUser: () => {
      const token = getCookieVal('sb-mock-auth-token');
      if (token) {
        try {
          const session = JSON.parse(token);
          return Promise.resolve({ data: { user: session.user }, error: null });
        } catch (err) {
          console.warn('Failed to parse mock user token', err);
        }
      }
      return Promise.resolve({ data: { user: null }, error: null });
    },
    getSession: () => {
      const token = getCookieVal('sb-mock-auth-token');
      if (token) {
        try {
          const session = JSON.parse(token);
          return Promise.resolve({ data: { session }, error: null });
        } catch (err) {
          console.warn('Failed to parse mock session token', err);
        }
      }
      return Promise.resolve({ data: { session: null }, error: null });
    },
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
      authSubscribers.push(callback);
      const token = getCookieVal('sb-mock-auth-token');
      let session = null;
      if (token) {
        try {
          session = JSON.parse(token);
        } catch (err) {
          console.warn('Failed to parse auth change token', err);
        }
      }
      callback('INITIAL_SESSION', session);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const idx = authSubscribers.indexOf(callback);
              if (idx >= 0) authSubscribers.splice(idx, 1);
            },
          },
        },
      };
    },
    signOut: () => {
      setCookieVal('sb-mock-auth-token', null);
      notifySubscribers('SIGNED_OUT', null);
      return Promise.resolve({ error: null });
    },
    signInWithPassword: ({ email }: { email: string }) => {
      const user = {
        id: 'test-user-id',
        email,
        user_metadata: { display_name: email.split('@')[0] || 'Green Pioneer' },
      };
      const session = {
        user,
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };
      setCookieVal('sb-mock-auth-token', JSON.stringify(session));
      notifySubscribers('SIGNED_IN', session);
      return Promise.resolve({ data: { user, session }, error: null });
    },
    signUp: ({
      email,
      options,
    }: {
      email: string;
      options?: { data?: { display_name?: string } };
    }) => {
      const user = {
        id: 'test-user-id',
        email,
        user_metadata: {
          display_name: options?.data?.display_name || email.split('@')[0] || 'Green Pioneer',
        },
      };
      const session = {
        user,
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };
      setCookieVal('sb-mock-auth-token', JSON.stringify(session));
      notifySubscribers('SIGNED_IN', session);
      return Promise.resolve({ data: { user, session }, error: null });
    },
    updateUser: (attributes: { data?: Record<string, unknown> }) => {
      const token = getCookieVal('sb-mock-auth-token');
      let user = { ...defaultUser };
      if (token) {
        try {
          const session = JSON.parse(token);
          user = session.user;
          if (attributes.data) {
            user.user_metadata = { ...user.user_metadata, ...attributes.data };
          }
          session.user = user;
          setCookieVal('sb-mock-auth-token', JSON.stringify(session));
          notifySubscribers('USER_UPDATED', session);
          return Promise.resolve({ data: { user }, error: null });
        } catch (err) {
          console.error('Failed to update mock user details', err);
        }
      }
      return Promise.resolve({ data: { user }, error: null });
    },
    setSession: () => {
      return Promise.resolve({ data: { session: null, user: null }, error: null });
    },
  },
  storage: {
    from: () => ({
      upload: (path: string, file: File) => {
        if (typeof window !== 'undefined') {
          try {
            const previousUrl = mockStorageMap[path];
            if (previousUrl && previousUrl.startsWith('blob:')) {
              URL.revokeObjectURL(previousUrl);
            }
            const objectUrl = URL.createObjectURL(file);
            mockStorageMap[path] = objectUrl;
          } catch (err) {
            console.error('Failed to upload mock storage file', err);
          }
        }
        return Promise.resolve({ data: { path }, error: null });
      },
      getPublicUrl: (path: string) => {
        const localUrl = mockStorageMap[path];
        if (localUrl) {
          return { data: { publicUrl: localUrl } };
        }
        return {
          data: {
            publicUrl: `https://placeholder.supabase.co/storage/v1/object/public/avatars/${path}`,
          },
        };
      },
    }),
  },
  from: (table: string) => createMockBuilder(table),
};
