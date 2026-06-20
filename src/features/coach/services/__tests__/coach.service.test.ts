/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserHighestCategory } from '../coach.service';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

let mockQueryResult: { data: any; error: any } = { data: null, error: null };

const mockBuilder: any = {
  select: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  eq: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  order: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  limit: vi.fn().mockImplementation(function (this: any) {
    return this;
  }),
  then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
    if (typeof onfulfilled === 'function') {
      return Promise.resolve(mockQueryResult).then(onfulfilled);
    }
    return Promise.resolve(mockQueryResult);
  }),
};

describe('coach.service.ts tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult = { data: null, error: null };
    mockFrom.mockReturnValue(mockBuilder);
  });

  it('returns default when no user is logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await fetchUserHighestCategory();
    expect(result).toBe('default');
  });

  it('returns default when assessments fetch fails or returns empty', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockQueryResult = { data: [], error: { message: 'Database error' } };

    const result = await fetchUserHighestCategory();
    expect(result).toBe('default');
  });

  it('returns default when assessment list is empty', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockQueryResult = { data: [], error: null };

    const result = await fetchUserHighestCategory();
    expect(result).toBe('default');
  });

  it('correctly returns highest carbon footprint category', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockQueryResult = {
      data: [
        {
          transport_score: 500, // highest
          diet_score: 100,
          energy_score: 300,
          shopping_score: 50,
          travel_score: 100,
        },
      ],
      error: null,
    };

    const result = await fetchUserHighestCategory();
    expect(result).toBe('Transport');
  });

  it('correctly handles fallbacks for missing scores (transport_kg instead of transport_score)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockQueryResult = {
      data: [
        {
          transport_kg: 200,
          diet_kg: 900, // highest
          energy_kg: 500,
          shopping_kg: 400,
          travel_score: 100,
        },
      ],
      error: null,
    };

    const result = await fetchUserHighestCategory();
    expect(result).toBe('Diet');
  });

  it('returns default when supabase client initialization throws', async () => {
    mockGetUser.mockRejectedValue(new Error('Supabase client crash'));
    const result = await fetchUserHighestCategory();
    expect(result).toBe('default');
  });
});
