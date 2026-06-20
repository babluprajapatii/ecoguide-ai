/* eslint-disable @typescript-eslint/no-explicit-any */

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
    data = data.map((row) => {
      return {
        ...row,
        badges: { slug: row.badge_slug || 'first_assessment' },
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

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { display_name: 'Green Pioneer' },
};

export const mockSupabaseClient: any = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
    getSession: () => Promise.resolve({ data: { session: { user: mockUser } }, error: null }),
    onAuthStateChange: () => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: mockUser }, error: null }),
    signUp: () => Promise.resolve({ data: { user: mockUser }, error: null }),
  },
  from: (table: string) => createMockBuilder(table),
};
