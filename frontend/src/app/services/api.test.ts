import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

global.fetch = mockFetch as typeof fetch;

describe('booking API contract', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  it('logs in and stores the auth token', async () => {
    const user = { id: 'u1', username: 'user', password: 'user123', role: 'user', name: 'John Doe', email: 'john@example.com', phone: '111-222-3333' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user, token: 'abc123' }),
      text: async () => JSON.stringify({ user, token: 'abc123' }),
    });

    const { api } = await import('./api');
    const result = await api.login('user', 'user123');

    expect(result.username).toBe('user');
    expect(localStorage.getItem('salon-auth-token')).toBe('abc123');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/auth\/login$/), expect.objectContaining({ method: 'POST' }));
  });

  it('creates a booking with required payload fields and offer amount', async () => {
    const booking = {
      salonId: 'salon1',
      customerName: 'Jane Doe',
      customerPhone: '123',
      serviceId: 's1',
      serviceName: 'Haircut',
      date: '2026-08-16',
      time: '10:00',
      status: 'scheduled' as const,
      customerId: 'u1',
      notes: 'New booking with offer',
      originalPrice: 500,
      offerId: 'o1',
      offerName: 'Festival 20% OFF',
      discountAmount: 100,
      amount: 400,
      offerAmount: 400,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...booking, id: 'b1' }),
      text: async () => JSON.stringify({ ...booking, id: 'b1' }),
    });

    const { api } = await import('./api');
    const result = await api.createAppointment(booking);

    expect(result.id).toBe('b1');
    expect(result.status).toBe('scheduled');
    expect(result.offerAmount).toBe(400);
    expect(result.offerName).toBe('Festival 20% OFF');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/appointments$/), expect.objectContaining({ method: 'POST' }));
  });
});
