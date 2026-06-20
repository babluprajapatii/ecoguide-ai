/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, no-empty */
import { BADGES } from '../../features/gamification/data/badges';

class InMemoryDB {
  private static store: Record<string, any[]> = {
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

  static getTable(table: string) {
    if (!this.store[table]) {
      this.store[table] = [];
    }
    return this.store[table];
  }
}

function createMockBuilder(table: string) {
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
      const cp = communityProfiles.find(
        (comp) => comp.user_id === row.user_id || comp.id === row.user_id,
      ) || {
        id: row.user_id,
        user_id: row.user_id,
        opt_in: true,
        leaderboard_opt_in: true,
        public_profile_visibility: 'public',
        bio: '',
      };
      return {
        ...row,
        profiles: p,
        community_profiles: cp,
        'community_profiles:user_id': cp,
      };
    });
  } else if (table === 'user_badges') {
    const badges = InMemoryDB.getTable('badges');
    data = data.map((row) => {
      const matchedBadge = badges.find(
        (b) =>
          b.id === row.badge_id ||
          b.slug === row.badge_slug ||
          `badge-uuid-${b.slug}` === row.badge_id,
      ) || {
        id: row.badge_id || 'badge-uuid-first_assessment',
        slug: 'first_assessment',
      };
      return {
        ...row,
        badges: matchedBadge,
      };
    });
  }

  let filteredData = [...data];

  let countOnly = false;

  const builder: any = {
    select: (_columns?: string, _options?: any) => {
      if (_options && _options.count === 'exact' && _options.head === true) {
        countOnly = true;
      }
      return builder;
    },
    eq: (column: string, value: any) => {
      filteredData = filteredData.filter((row) => row[column] === value);
      return builder;
    },
    neq: (column: string, value: any) => {
      filteredData = filteredData.filter((row) => row[column] !== value);
      return builder;
    },
    gte: (column: string, value: any) => {
      filteredData = filteredData.filter((row) => row[column] >= value);
      return builder;
    },
    lte: (column: string, value: any) => {
      filteredData = filteredData.filter((row) => row[column] <= value);
      return builder;
    },
    order: (column: string, options?: any) => {
      filteredData.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        const asc = options?.ascending !== false;
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
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
    insert: (values: any) => {
      const rows = Array.isArray(values) ? values : [values];
      rows.forEach((r) => {
        if (table === 'community_profiles') {
          if (!r.user_id && r.id) r.user_id = r.id;
          if (!r.id && r.user_id) r.id = r.user_id;
        }
        const uuid =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2);
        const newRow = { id: r.id || uuid, created_at: new Date().toISOString(), ...r };
        data.push(newRow);
        filteredData.push(newRow);
      });
      return builder;
    },
    update: (values: any) => {
      filteredData.forEach((row) => {
        Object.assign(row, values);
      });
      return builder;
    },
    upsert: (values: any) => {
      const rows = Array.isArray(values) ? values : [values];
      rows.forEach((r) => {
        if (table === 'community_profiles') {
          if (!r.user_id && r.id) r.user_id = r.id;
          if (!r.id && r.user_id) r.id = r.user_id;
        }
        let index = -1;
        if (table === 'community_stats_cache') {
          index = data.findIndex((row) => row.id === 1 || row.id === '1');
        } else if (r.id) {
          index = data.findIndex((row) => row.id === r.id);
        } else if (r.user_id) {
          index = data.findIndex((row) => row.user_id === r.user_id);
        }

        if (index >= 0) {
          Object.assign(data[index], r);
          const fIndex = filteredData.findIndex(
            (row) => row.id === r.id || row.user_id === r.user_id,
          );
          if (fIndex >= 0) Object.assign(filteredData[fIndex], r);
        } else {
          const uuid =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2);
          const newRow = { id: r.id || uuid, created_at: new Date().toISOString(), ...r };
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
    then: (onfulfilled?: (value: any) => any) => {
      const res = countOnly
        ? { data: null, error: null, count: filteredData.length }
        : { data: filteredData, error: null, count: filteredData.length };
      return Promise.resolve(onfulfilled ? onfulfilled(res) : res);
    },
    single: () => {
      const res = {
        data: filteredData[0] || null,
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

const authSubscribers: Array<(event: string, session: any) => void> = [];
const mockStorageMap: Record<string, string> = {};

function getCookieVal(name: string): string | null {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match && match[2] ? decodeURIComponent(match[2]) : null;
  }
  try {
    const { cookies } = require('next/headers');
    const store = cookies();
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
    const { cookies } = require('next/headers');
    const store = cookies();
    if (value === null) {
      store.delete(name);
    } else {
      store.set(name, value, { path: '/', maxAge: 604800 });
    }
  } catch (err) {
    console.debug('Failed to set cookie in mock server context', err);
  }
}

function notifySubscribers(event: string, session: any) {
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

export const mockSupabaseClient: any = {
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
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
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
    signInWithPassword: ({ email }: any) => {
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
    signUp: ({ email, options }: any) => {
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
    updateUser: (attributes: any) => {
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
