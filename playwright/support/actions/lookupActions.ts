import { Page, expect } from '@playwright/test'

export function createLookupActions(page: Page) {
  const orderInput = page.getByTestId('search-order-id')
  const searchButton = page.getByTestId('search-order-button')
  const orderResultStatus = page.getByTestId('order-result-status')

  return {
    elements: {
      orderInput,
      searchButton,
      orderResultStatus,
    },

    /** Abre a tela de consulta de pedido. */
    async open() {
      await page.goto('/lookup')
    },

    /** Preenche o numero do pedido e executa a busca. */
    async searchOrder(orderNumber: string) {
      await orderInput.fill(orderNumber)
      await searchButton.click()
    },

    /** Valida o status exibido no resultado da consulta. */
    async expectOrderStatus(statusText: string) {
      await expect(orderResultStatus).toContainText(statusText)
    },

    /** Abre a consulta, busca o pedido e valida o status final. */
    async searchAndExpectStatus(orderNumber: string, statusText: string) {
      await this.open()
      await this.searchOrder(orderNumber)
      await this.expectOrderStatus(statusText)
    },
  }
}
