import { Page, expect } from '@playwright/test'

export function createCheckoutActions(page: Page) {



  return {

    elements: {
      heading: page.getByRole('heading', { name: 'Finalizar Pedido' }),
      summaryTotalPrice: page.getByTestId('summary-total-price'),
      paymentCash: page.getByRole('button', { name: 'À Vista' }),
      paymentFinance: page.getByRole('button', { name: 'Financiamento' }),
      entryValueInput: page.getByTestId('input-entry-value'),
      successHeading: page.getByRole('heading', { name: 'Pedido Aprovado!' }),
      submitButton: page.getByTestId('checkout-submit'),
      form: page.locator('form'),
      nameInput: page.getByTestId('checkout-name'),
      lastnameInput: page.getByTestId('checkout-lastname'),
      emailInput: page.getByTestId('checkout-email'),
      phoneInput: page.getByTestId('checkout-phone'),
      documentInput: page.getByTestId('checkout-document'),
      storeSelect: page.getByTestId('checkout-store'),
      terms: page.getByTestId('checkout-terms'),
      alerts: {
        name: page.getByTestId('error-name'),
        lastname: page.getByTestId('error-lastname'),
        email: page.getByTestId('error-email'),
        phone: page.getByTestId('error-phone'),
        document: page.getByTestId('error-document'),
        store: page.getByTestId('error-store'),
        terms: page.getByTestId('error-terms')
      }
    },
    
    /** Abre a pagina de checkout e aguarda o carregamento do formulario. */
    async open() {
      await page.goto('/order')
      await this.expectLoaded()
    },

    /** Garante que o titulo principal do checkout esta visivel. */
    async expectLoaded() {
      await expect(this.elements.heading).toBeVisible()
    },

    /** Valida o total exibido no resumo de compra.
     * @param price valor esperado do preco total exibido no resumo (ex: "R$ 99.990,00")
     */
    async expectSummaryTotal(price: string) {
      await expect(this.elements.summaryTotalPrice).toHaveText(price)
    },

    /** Envia o formulario de checkout. */
    async submit() {
      await this.elements.submitButton.click()
    },

    /** Desativa validacao HTML5 nativa para testar mensagens customizadas. */
    async disableHtml5Validation() {
      await this.elements.form.evaluate((form: HTMLFormElement) => form.setAttribute('novalidate', 'true'))
    },

    /** Preenche os dados do cliente e seleciona a loja de retirada. 
     * @param data objeto contendo os dados do cliente e a loja de retirada
     * @param data.name nome do cliente
     * @param data.lastname sobrenome do cliente
     * @param data.email email do cliente
     * @param data.phone telefone do cliente
     * @param data.document documento do cliente (CPF)
     * @param data.store nome da loja de retirada, deve ser igual ao exibido na UI
    */
    async fillCustomerData(data: { name: string, lastname: string, email: string, phone: string, document: string, store: string }) {
      await this.elements.nameInput.fill(data.name)
      await this.elements.lastnameInput.fill(data.lastname)
      await this.elements.emailInput.fill(data.email)
      await this.elements.phoneInput.fill(data.phone)
      await this.elements.documentInput.fill(data.document)
      await this.elements.storeSelect.click()
      await page.getByRole('option', { name: data.store }).click()
    },

    /** Retorna o locator da mensagem de erro de acordo com o rotulo do campo. 
     * @param fieldLabel rotulo do campo a ser verificado (ex: "Nome", "Email", "CPF", "Termos de Uso")
     * @returns locator da mensagem de erro associada ao campo
    */
    getFieldError(fieldLabel: string) {
      const fieldMap: Record<string, any> = {
        'Nome': this.elements.alerts.name,
        'Sobrenome': this.elements.alerts.lastname,
        'Email': this.elements.alerts.email,
        'Telefone': this.elements.alerts.phone,
        'CPF': this.elements.alerts.document,
        'Loja para Retirada': this.elements.alerts.store,
        'Termos de Uso': this.elements.alerts.terms
      }
      return fieldMap[fieldLabel]
    },

    /** Seleciona uma loja no combo de retirada. 
     * @param store nome da loja a ser selecionada, deve ser igual ao exibido na UI
    */
    async selectStore(store: string) {
      await this.elements.storeSelect.click()
      await page.getByRole('option', { name: store }).click()
    },

    /** Marca o aceite dos termos de uso. */
    async acceptTerms() {
      await this.elements.terms.check()
    },

    /** Seleciona o metodo de pagamento a vista. */
    async selectPaymentCash() {
      await this.elements.paymentCash.click()
    },

    /** Seleciona o metodo de pagamento via financiamento. */
    async selectPaymentFinance() {
      await this.elements.paymentFinance.click()
    },

    /** Preenche o valor de entrada no fluxo de financiamento. */
    async fillDownPayment(value: string) {
      await this.elements.entryValueInput.fill(value)
    }
    
  }
}

