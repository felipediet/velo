import { test as base } from '@playwright/test'

import { createCheckoutActions } from './actions/checkOutActions'
import { createConfiguratorActions } from './actions/configuratorActions'
import { createLookupActions } from './actions/lookupActions'
import { createOrderLookupActions } from './actions/orderLookupActions'
import { createOrderStatusActions } from './actions/orderStatusActions'

import { setScoreMock } from './mock.api'

type App = {
  checkout: ReturnType<typeof createCheckoutActions>
  configurator: ReturnType<typeof createConfiguratorActions>
  lookup: ReturnType<typeof createLookupActions>
  orderLookup: ReturnType<typeof createOrderLookupActions>
  orderStatus: ReturnType<typeof createOrderStatusActions>
  mock: {
    setScore: (score: number) => Promise<void>
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    const app: App = {
      checkout: createCheckoutActions(page),
      configurator: createConfiguratorActions(page),
      lookup: createLookupActions(page),
      orderLookup: createOrderLookupActions(page),
      orderStatus: createOrderStatusActions(page),
      mock: {
        setScore: async (score: number) => await setScoreMock(page, score)
      }
    }
    await use(app)
  },
})

export { expect } from '@playwright/test'
