import { Page, expect } from '@playwright/test'

export function createConfiguratorActions(page: Page) {
  /** Retorna o locator do checkbox de opcional pelo nome exibido na UI. */
  const optionalCheckbox = (name: string | RegExp) => page.getByRole('checkbox', { name })

  return {
    /** Abre a pagina do configurador. */
    async open() {
      await page.goto('/configure')
    },

    /** Seleciona uma cor externa do veiculo. 
     * @param name nome da cor a ser selecionada, deve ser igual ao exibido na UI
    */
    async selectColor(name: string) {
      await page.getByRole('button', { name }).click()
    },

    /** Seleciona o tipo de roda no configurador. 
     * @param name nome do tipo de roda a ser selecionado, deve ser igual ao exibido na UI
    */
    async selectWheels(name: string | RegExp) {
      await page.getByRole('button', { name }).click()
    },

    /** Valida o preco total exibido no configurador. */
    async expectPrice(price: string) {
      const priceElement = page.getByTestId('total-price')
      await expect(priceElement).toBeVisible()
      await expect(priceElement).toHaveText(price)
    },

    /**
     * Valida o src da imagem do carro aceitando assets com hash (build/CI)
     * e sem hash (desenvolvimento).
     * @param src caminho esperado da imagem do carro
     */
    async expectCarImageSrc(src: string | RegExp) {
      const carImage = page.locator('img[alt^="Velô Sprint"]')
      await expect(carImage).toHaveAttribute('src', src)
    },

    /** Marca um opcional pelo nome. */
    async checkOptional(name: string | RegExp) {
      await expect(optionalCheckbox(name)).toBeVisible()
      await optionalCheckbox(name).check()
    },

    /** Desmarca um opcional pelo nome. 
     * @param name nome do opcional a ser desmarcado, deve ser igual ao exibido na UI
    */
    async uncheckOptional(name: string | RegExp) {
      await expect(optionalCheckbox(name)).toBeVisible()
      await optionalCheckbox(name).uncheck()
    },

    /** Finaliza o configurador e navega para o checkout. */
    async finishConfigurator() {
      await page.getByRole('button', { name: 'Monte o Seu' }).click()
    },


  }
}
