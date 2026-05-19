import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTotalPrice,
  calculateInstallment,
  formatPrice,
  migrateConfiguratorState,
  useConfiguratorStore,
  type CarConfiguration,
  type Order,
  type OptionalFeature,
} from './configuratorStore';

const defaultConfiguration: CarConfiguration = {
  exteriorColor: 'glacier-blue',
  interiorColor: 'carbon-black',
  wheelType: 'aero',
  optionals: [],
};

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    configuration: { ...defaultConfiguration },
    totalPrice: 40000,
    customer: {
      name: 'João',
      surname: 'Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      cpf: '12345678901',
      store: 'loja-1',
    },
    paymentMethod: 'avista',
    status: 'EM_ANALISE',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function resetStore() {
  localStorage.clear();
  useConfiguratorStore.persist.clearStorage();
  useConfiguratorStore.setState({
    configuration: { ...defaultConfiguration },
    viewMode: 'exterior',
    orders: [],
    currentUserEmail: null,
  });
}

describe('calculateTotalPrice', () => {
  it('returns base price for default configuration', () => {
    expect(calculateTotalPrice(defaultConfiguration)).toBe(40000);
  });

  it('adds sport wheels surcharge', () => {
    expect(
      calculateTotalPrice({ ...defaultConfiguration, wheelType: 'sport' })
    ).toBe(42000);
  });

  it('adds optional prices', () => {
    expect(
      calculateTotalPrice({
        ...defaultConfiguration,
        optionals: ['precision-park'],
      })
    ).toBe(45500);

    expect(
      calculateTotalPrice({
        ...defaultConfiguration,
        optionals: ['precision-park', 'flux-capacitor'],
      })
    ).toBe(50500);
  });

  it('combines sport wheels and optionals', () => {
    expect(
      calculateTotalPrice({
        ...defaultConfiguration,
        wheelType: 'sport',
        optionals: ['flux-capacitor'],
      })
    ).toBe(47000);
  });

  it('treats non-array optionals as empty', () => {
    const config = {
      ...defaultConfiguration,
      optionals: undefined as unknown as OptionalFeature[],
    };
    expect(calculateTotalPrice(config)).toBe(40000);
  });

  it('ignores unknown optional keys', () => {
    const config = {
      ...defaultConfiguration,
      optionals: ['unknown-opt' as OptionalFeature],
    };
    expect(calculateTotalPrice(config)).toBe(40000);
  });
});

describe('calculateInstallment', () => {
  it('computes 12x installment with 2% monthly compound interest', () => {
    const total = 40000;
    const monthlyRate = 0.02;
    const months = 12;
    const expected =
      Math.round(
        ((total * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1)) *
          100
      ) / 100;

    expect(calculateInstallment(total)).toBe(expected);
  });

  it('rounds to two decimal places', () => {
    const result = calculateInstallment(12345.67);
    expect(result).toBe(Math.round(result * 100) / 100);
  });
});

describe('formatPrice', () => {
  it('formats values as BRL currency in pt-BR', () => {
    expect(formatPrice(40000)).toBe(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(40000)
    );
  });

  it('formats zero and decimal values', () => {
    expect(formatPrice(0)).toMatch(/R\$\s*0,00/);
    expect(formatPrice(1234.56)).toMatch(/1\.234,56/);
  });
});

describe('migrateConfiguratorState', () => {
  it('keeps only valid optional feature keys', () => {
    const state = {
      configuration: {
        optionals: ['precision-park', 'invalid', 'flux-capacitor'],
      },
    };
    const result = migrateConfiguratorState(state);
    expect(result.configuration?.optionals).toEqual([
      'precision-park',
      'flux-capacitor',
    ]);
  });

  it('normalizes non-array optionals to empty array', () => {
    const state = { configuration: { optionals: null } };
    const result = migrateConfiguratorState(state);
    expect(result.configuration?.optionals).toEqual([]);
  });

  it('filters non-string entries', () => {
    const state = {
      configuration: { optionals: [123, 'flux-capacitor'] },
    };
    const result = migrateConfiguratorState(state);
    expect(result.configuration?.optionals).toEqual(['flux-capacitor']);
  });

  it('returns state unchanged when configuration is missing', () => {
    const state = { orders: [] };
    expect(migrateConfiguratorState(state)).toEqual(state);
  });
});

describe('useConfiguratorStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('has default configuration and empty session', () => {
      const state = useConfiguratorStore.getState();
      expect(state.configuration).toEqual(defaultConfiguration);
      expect(state.viewMode).toBe('exterior');
      expect(state.orders).toEqual([]);
      expect(state.currentUserEmail).toBeNull();
    });
  });

  describe('configuration actions', () => {
    it('setExteriorColor updates color and switches to exterior view', () => {
      useConfiguratorStore.getState().setExteriorColor('midnight-black');
      const state = useConfiguratorStore.getState();
      expect(state.configuration.exteriorColor).toBe('midnight-black');
      expect(state.viewMode).toBe('exterior');
    });

    it('setInteriorColor updates color and switches to interior view', () => {
      useConfiguratorStore.getState().setInteriorColor('deep-blue');
      const state = useConfiguratorStore.getState();
      expect(state.configuration.interiorColor).toBe('deep-blue');
      expect(state.viewMode).toBe('interior');
    });

    it('setWheelType updates wheel type without changing view mode', () => {
      useConfiguratorStore.setState({ viewMode: 'interior' });
      useConfiguratorStore.getState().setWheelType('sport');
      const state = useConfiguratorStore.getState();
      expect(state.configuration.wheelType).toBe('sport');
      expect(state.viewMode).toBe('interior');
    });

    it('setViewMode updates only view mode', () => {
      useConfiguratorStore.getState().setViewMode('interior');
      expect(useConfiguratorStore.getState().viewMode).toBe('interior');
    });

    it('toggleOptional adds and removes optionals', () => {
      const { toggleOptional } = useConfiguratorStore.getState();
      toggleOptional('precision-park');
      expect(useConfiguratorStore.getState().configuration.optionals).toEqual([
        'precision-park',
      ]);
      toggleOptional('precision-park');
      expect(useConfiguratorStore.getState().configuration.optionals).toEqual(
        []
      );
    });

    it('toggleOptional handles undefined optionals', () => {
      useConfiguratorStore.setState({
        configuration: {
          ...defaultConfiguration,
          optionals: undefined as unknown as OptionalFeature[],
        },
      });
      useConfiguratorStore.getState().toggleOptional('flux-capacitor');
      expect(useConfiguratorStore.getState().configuration.optionals).toEqual([
        'flux-capacitor',
      ]);
    });

    it('resetConfiguration restores defaults without clearing orders or session', () => {
      const order = createMockOrder();
      useConfiguratorStore.getState().addOrder(order);
      useConfiguratorStore.getState().login('joao@example.com');
      useConfiguratorStore.getState().setExteriorColor('lunar-white');
      useConfiguratorStore.getState().toggleOptional('precision-park');
      useConfiguratorStore.getState().resetConfiguration();

      const state = useConfiguratorStore.getState();
      expect(state.configuration).toEqual(defaultConfiguration);
      expect(state.orders).toHaveLength(1);
      expect(state.currentUserEmail).toBe('joao@example.com');
    });
  });

  describe('orders and auth', () => {
    it('addOrder appends orders', () => {
      const order1 = createMockOrder({ id: 'order-1' });
      const order2 = createMockOrder({
        id: 'order-2',
        customer: { ...order1.customer, email: 'maria@example.com' },
      });
      useConfiguratorStore.getState().addOrder(order1);
      useConfiguratorStore.getState().addOrder(order2);
      expect(useConfiguratorStore.getState().orders).toHaveLength(2);
    });

    it('login succeeds when email has orders', () => {
      useConfiguratorStore.getState().addOrder(createMockOrder());
      const success = useConfiguratorStore.getState().login('joao@example.com');
      expect(success).toBe(true);
      expect(useConfiguratorStore.getState().currentUserEmail).toBe(
        'joao@example.com'
      );
    });

    it('login fails when email has no orders', () => {
      const success = useConfiguratorStore
        .getState()
        .login('unknown@example.com');
      expect(success).toBe(false);
      expect(useConfiguratorStore.getState().currentUserEmail).toBeNull();
    });

    it('logout clears current user email', () => {
      useConfiguratorStore.getState().addOrder(createMockOrder());
      useConfiguratorStore.getState().login('joao@example.com');
      useConfiguratorStore.getState().logout();
      expect(useConfiguratorStore.getState().currentUserEmail).toBeNull();
    });

    it('getUserOrders returns empty array when not logged in', () => {
      useConfiguratorStore.getState().addOrder(createMockOrder());
      expect(useConfiguratorStore.getState().getUserOrders()).toEqual([]);
    });

    it('getUserOrders returns only orders for logged-in user', () => {
      const joaoOrder = createMockOrder({ id: 'order-1' });
      const mariaOrder = createMockOrder({
        id: 'order-2',
        customer: { ...joaoOrder.customer, email: 'maria@example.com' },
      });
      useConfiguratorStore.getState().addOrder(joaoOrder);
      useConfiguratorStore.getState().addOrder(mariaOrder);
      useConfiguratorStore.getState().login('joao@example.com');
      expect(useConfiguratorStore.getState().getUserOrders()).toEqual([
        joaoOrder,
      ]);
    });
  });
});
