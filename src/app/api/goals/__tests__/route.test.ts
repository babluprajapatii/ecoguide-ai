/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Goals API Route Handlers', () => {
  let mockResult: { data: any; error: any } = { data: null, error: null };
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();

  const mockBuilder: any = {
    select: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    insert: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    update: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    delete: vi.fn().mockImplementation(function (this: any) {
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
    single: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    maybeSingle: vi.fn().mockImplementation(function (this: any) {
      return this;
    }),
    then: vi.fn().mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve(mockResult).then(onfulfilled);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = { data: null, error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
    mockFrom.mockReturnValue(mockBuilder);

    // Reset standard promise response resolver
    mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
      return Promise.resolve(mockResult).then(onfulfilled);
    });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    } as any);
  });

  describe('GET /api/goals', () => {
    it('returns 401 when unauthorized', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth error') });
      const req = new NextRequest('http://localhost/api/goals');
      const res = await GET(req);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: 'Authentication required.' });
    });

    it('returns user goals successfully', async () => {
      const goalsList = [
        {
          id: '1',
          title: 'Goal 1',
          category: 'total',
          target_value: 10,
          current_value: 0,
          unit: '%',
        },
      ];
      mockResult = { data: goalsList, error: null };

      const req = new NextRequest('http://localhost/api/goals');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(goalsList);
      expect(mockFrom).toHaveBeenCalledWith('goals');
    });

    it('returns 500 when database error occurs', async () => {
      mockResult = { data: null, error: { message: 'Database error' } };

      const req = new NextRequest('http://localhost/api/goals');
      const res = await GET(req);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: 'Failed to fetch goals.' });
    });
  });

  describe('POST /api/goals', () => {
    it('returns 401 when unauthorized', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const req = new NextRequest('http://localhost/api/goals', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Goal', category: 'total', target_value: 10, unit: '%' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid request body validation', async () => {
      const req = new NextRequest('http://localhost/api/goals', {
        method: 'POST',
        body: JSON.stringify({ title: '', category: 'invalid-category', target_value: -5 }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toBe('Validation failed.');
    });

    it('returns 409 when a goal with the same title already exists', async () => {
      mockResult = { data: [{ id: 'existing-id' }], error: null };

      const req = new NextRequest('http://localhost/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Duplicate Goal',
          category: 'total',
          target_value: 10,
          unit: '%',
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ message: 'A goal with this title already exists.' });
    });

    it('creates goal successfully when no duplicates exist', async () => {
      // First call for duplicate check (returns empty array), second call for insert (returns inserted goal)
      let duplicateCheckDone = false;
      const insertedGoal = {
        id: 'new-id',
        title: 'Unique Goal',
        category: 'total',
        target_value: 10,
        current_value: 0,
        unit: '%',
        status: 'in_progress',
      };

      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        if (!duplicateCheckDone) {
          duplicateCheckDone = true;
          return Promise.resolve({ data: [], error: null }).then(onfulfilled);
        }
        return Promise.resolve({ data: insertedGoal, error: null }).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Unique Goal',
          category: 'total',
          target_value: 10,
          unit: '%',
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(insertedGoal);
    });
  });

  describe('PUT /api/goals', () => {
    it('returns 403 when updating a goal owned by another user', async () => {
      // Fetch check returns owner ID different from 'test-user-id'
      mockResult = { data: { user_id: 'other-user-id', target_value: 10 }, error: null };

      const req = new NextRequest('http://localhost/api/goals', {
        method: 'PUT',
        body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000', current_value: 5 }),
      });
      const res = await PUT(req);

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: 'Forbidden: You do not own this goal.' });
    });

    it('auto-completes status when current value reaches target value', async () => {
      let isFetchDone = false;
      const updatedGoal = { id: 'goal-id', current_value: 10, status: 'completed' };

      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        if (!isFetchDone) {
          isFetchDone = true;
          return Promise.resolve({
            data: { user_id: 'test-user-id', target_value: 10 },
            error: null,
          }).then(onfulfilled);
        }
        return Promise.resolve({ data: updatedGoal, error: null }).then(onfulfilled);
      });

      const req = new NextRequest('http://localhost/api/goals', {
        method: 'PUT',
        body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000', current_value: 10 }),
      });
      const res = await PUT(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updatedGoal);
      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_value: 10,
          status: 'completed',
        }),
      );
    });
  });

  describe('DELETE /api/goals', () => {
    it('returns 400 when id is missing', async () => {
      const req = new NextRequest('http://localhost/api/goals');
      const res = await DELETE(req);

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: 'Missing goal ID.' });
    });

    it('returns 404 when goal does not exist', async () => {
      mockResult = { data: null, error: null };

      const req = new NextRequest(
        'http://localhost/api/goals?id=00000000-0000-0000-0000-000000000000',
      );
      const res = await DELETE(req);

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ message: 'Goal not found.' });
    });

    it('deletes goal successfully when owned by current user', async () => {
      let isFetchDone = false;

      mockBuilder.then.mockImplementation(function (this: any, onfulfilled: any) {
        if (!isFetchDone) {
          isFetchDone = true;
          return Promise.resolve({ data: { user_id: 'test-user-id' }, error: null }).then(
            onfulfilled,
          );
        }
        return Promise.resolve({ data: null, error: null }).then(onfulfilled);
      });

      const req = new NextRequest(
        'http://localhost/api/goals?id=00000000-0000-0000-0000-000000000000',
      );
      const res = await DELETE(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: 'Goal deleted successfully.' });
      expect(mockBuilder.delete).toHaveBeenCalled();
    });
  });
});
