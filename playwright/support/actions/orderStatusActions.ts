import { Page, expect } from '@playwright/test'

export function createOrderStatusActions(page: Page) {
  const successStatus = page.getByTestId('success-status')
  const orderNumber = page.getByTestId('order-id')

  return {
    elements: {
      successStatus,
      orderNumber,
    },

    /** Valida o texto de status exibido na tela de status após inclusão do pedido. */
    async assertStatus(statusText: string) {
        await expect(page).toHaveURL(/\/success/)
        await expect(successStatus).toHaveText(statusText)
    },

    /** Retorna o numero do pedido exibido na tela de status após a inclusão do pedido. */
    async getOrderNumber() {
      await expect(orderNumber).toBeVisible()
      return orderNumber.innerText()
    },

  }
}
