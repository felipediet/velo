import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateOrderNumber,
  dbOrderToOrder,
  createOrder,
  getOrderByNumber,
  type DbOrder,
} from './useOrders';
import type { OptionalFeature } from '@/store/configuratorStore';

// ─── Mock do cliente Supabase ────────────────────────────────────────────────

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: mockInsert,
      select: () => ({ eq: mockEq }),
    }),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDbOrder(overrides: Partial<DbOrder> = {}): DbOrder {
  return {
    id: 'uuid-1',
    order_number: 'VLO-ABC123',
    color: 'glacier-blue',
    wheel_type: 'aero',
    optionals: ['precision-park'],
    customer_name: 'João Silva',
    customer_email: 'joao@example.com',
    customer_phone: '11999999999',
    customer_cpf: '12345678901',
    payment_method: 'avista',
    total_price: 45500,
    status: 'EM_ANALISE',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── generateOrderNumber ─────────────────────────────────────────────────────

describe('generateOrderNumber', () => {
  it('começa com VLO-', () => {
    expect(generateOrderNumber()).toMatch(/^VLO-/);
  });

  it('tem 10 caracteres no total', () => {
    expect(generateOrderNumber()).toHaveLength(10);
  });

  it('sufixo contém apenas letras maiúsculas e dígitos', () => {
    const suffix = generateOrderNumber().slice(4);
    expect(suffix).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('gera valores distintos em chamadas consecutivas', () => {
    const set = new Set(Array.from({ length: 100 }, () => generateOrderNumber()));
    // Probabilidade de colisão em 100 chamadas com 36^6 ~= 2bi combinações é desprezível
    expect(set.size).toBeGreaterThan(90);
  });
});

// ─── dbOrderToOrder ───────────────────────────────────────────────────────────

describe('dbOrderToOrder', () => {
  it('mapeia campos básicos corretamente', () => {
    const order = dbOrderToOrder(buildDbOrder());
    expect(order.id).toBe('VLO-ABC123');
    expect(order.configuration.exteriorColor).toBe('glacier-blue');
    expect(order.configuration.wheelType).toBe('aero');
    expect(order.totalPrice).toBe(45500);
    expect(order.paymentMethod).toBe('avista');
    expect(order.status).toBe('EM_ANALISE');
    expect(order.createdAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('divide nome composto em name e surname', () => {
    const order = dbOrderToOrder(buildDbOrder({ customer_name: 'João Silva Santos' }));
    expect(order.customer.name).toBe('João');
    expect(order.customer.surname).toBe('Silva Santos');
  });

  it('nome simples resulta em surname vazio', () => {
    const order = dbOrderToOrder(buildDbOrder({ customer_name: 'João' }));
    expect(order.customer.name).toBe('João');
    expect(order.customer.surname).toBe('');
  });

  it('customer_name vazio não quebra', () => {
    const order = dbOrderToOrder(buildDbOrder({ customer_name: '' }));
    expect(order.customer.name).toBe('');
    expect(order.customer.surname).toBe('');
  });

  it('optionals null é convertido para array vazio', () => {
    const order = dbOrderToOrder(buildDbOrder({ optionals: null }));
    expect(order.configuration.optionals).toEqual([]);
  });

  it('optionals preenchidos são preservados', () => {
    const order = dbOrderToOrder(buildDbOrder({ optionals: ['precision-park', 'flux-capacitor'] }));
    expect(order.configuration.optionals).toEqual(['precision-park', 'flux-capacitor']);
  });

  it('total_price é convertido para number', () => {
    const order = dbOrderToOrder(buildDbOrder({ total_price: '40000.50' as unknown as number }));
    expect(typeof order.totalPrice).toBe('number');
    expect(order.totalPrice).toBe(40000.5);
  });

  it('interiorColor não é cream (regressão do bug)', () => {
    const order = dbOrderToOrder(buildDbOrder());
    expect(order.configuration.interiorColor).not.toBe('cream');
  });

  it('store começa como string vazia (preenchido depois por createOrder)', () => {
    const order = dbOrderToOrder(buildDbOrder());
    expect(order.customer.store).toBe('');
  });
});

// ─── createOrder ─────────────────────────────────────────────────────────────

const orderInput = {
  configuration: {
    exteriorColor: 'glacier-blue' as const,
    interiorColor: 'carbon-black' as const,
    wheelType: 'aero' as const,
    optionals: ['precision-park'] as OptionalFeature[],
  },
  totalPrice: 45500,
  customer: {
    name: 'João',
    surname: 'Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    cpf: '12345678901',
    store: 'loja-sp',
  },
  paymentMethod: 'avista' as const,
  status: 'EM_ANALISE' as const,
};

describe('createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna order mapeada no caminho feliz', async () => {
    const dbRow = buildDbOrder({ customer_name: 'João Silva' });
    mockInsert.mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: dbRow, error: null }) }) });

    const { order, error } = await createOrder(orderInput);

    expect(error).toBeNull();
    expect(order).not.toBeNull();
    expect(order!.customer.store).toBe('loja-sp');
    expect(order!.totalPrice).toBe(45500);
  });

  it('restaura o campo store na order retornada', async () => {
    const dbRow = buildDbOrder({ customer_name: 'João Silva' });
    mockInsert.mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: dbRow, error: null }) }) });

    const { order } = await createOrder({ ...orderInput, customer: { ...orderInput.customer, store: 'loja-rj' } });

    expect(order!.customer.store).toBe('loja-rj');
  });

  it('retorna { order: null, error: mensagem } quando Supabase falha', async () => {
    mockInsert.mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'insert failed' } }),
      }),
    });

    const { order, error } = await createOrder(orderInput);

    expect(order).toBeNull();
    expect(error).toBe('insert failed');
  });
});

// ─── getOrderByNumber ─────────────────────────────────────────────────────────

describe('getOrderByNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  it('retorna order quando pedido é encontrado', async () => {
    const dbRow = buildDbOrder();
    mockMaybeSingle.mockResolvedValue({ data: dbRow, error: null });

    const { order, error } = await getOrderByNumber('VLO-ABC123');

    expect(error).toBeNull();
    expect(order).not.toBeNull();
    expect(order!.id).toBe('VLO-ABC123');
  });

  it('retorna { order: null, error: null } quando pedido não existe', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const { order, error } = await getOrderByNumber('VLO-XXXXX');

    expect(order).toBeNull();
    expect(error).toBeNull();
  });

  it('retorna { order: null, error: mensagem } quando Supabase falha', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'connection error' } });

    const { order, error } = await getOrderByNumber('VLO-ABC123');

    expect(order).toBeNull();
    expect(error).toBe('connection error');
  });

  it('normaliza o input com trim e toUpperCase antes de consultar', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await getOrderByNumber('  vlo-abc123  ');

    expect(mockEq).toHaveBeenCalledWith('order_number', 'VLO-ABC123');
  });
});
