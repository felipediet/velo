import { deleteOrderByCPFDocument, deleteOrderByNumber } from '../support/database/orderRepository'
import { test, expect } from '../support/fixtures'

const VALID_DATA = {
  name: 'Fernando',
  lastname: 'Papito',
  email: 'papito@velo.dev',
  phone: '(11) 99999-9999',
  document: '780.228.290-05',
  store: 'Velô Paulista - Av. Paulista, 1000',
}

test.describe('Checkout', () => {


  test.describe('Validações de Campos Obrigatórios', () => {

    test.beforeEach(async ({ app }) => {
      await app.checkout.open()
    })


    test('deve exibir erros ao submeter formulário em branco', async ({ app }) => {
      await app.checkout.submit()

      await expect(app.checkout.elements.alerts.name).toBeVisible()
      await expect(app.checkout.elements.alerts.lastname).toBeVisible()
      await expect(app.checkout.elements.alerts.email).toBeVisible()
      await expect(app.checkout.elements.alerts.phone).toBeVisible()
      await expect(app.checkout.elements.alerts.document).toBeVisible()
      await expect(app.checkout.elements.alerts.store).toBeVisible()
      await expect(app.checkout.elements.alerts.terms).toBeVisible()
    })

    test('deve exibir erro quando Nome ou Sobrenome tiver menos de 2 caracteres', async ({ app }) => {
      const DATA = {
        name: 'F',
        lastname: 'P',
        email: 'papito@velo.dev',
        phone: '(11) 99999-9999',
        document: '780.228.290-05',
        store: 'Velô Paulista - Av. Paulista, 1000',
      }

      await app.checkout.fillCustomerData({ ...DATA, name: 'F', lastname: 'P' })
      await app.checkout.acceptTerms()

      await app.checkout.submit()

      await expect(app.checkout.elements.alerts.name).toHaveText('Nome deve ter pelo menos 2 caracteres')
      await expect(app.checkout.elements.alerts.lastname).toHaveText('Sobrenome deve ter pelo menos 2 caracteres')
    })

    test('deve exibir erro de Email inválido', async ({ app }) => {
      await app.checkout.disableHtml5Validation()
      await app.checkout.fillCustomerData({ ...VALID_DATA, email: 'clientemail' })
      await app.checkout.acceptTerms()
      await app.checkout.submit()

      await expect(app.checkout.elements.alerts.email).toHaveText('Email inválido')
    })

    test('deve exibir erro de CPF inválido quando não preenchido', async ({ app }) => {
      // Nota: react-input-mask completa o campo com '_' atingindo 14 chars se interagirmos
      // O teste valida o cenário do CPF deixado em branco e preenchemos o resto
      await app.checkout.fillCustomerData({ ...VALID_DATA, document: '' })
      await app.checkout.acceptTerms()
      await app.checkout.submit()

      await expect(app.checkout.elements.alerts.document).toHaveText('CPF inválido')
    })

    test('deve exibir erro ao não aceitar os Termos de Uso', async ({ app }) => {
      await app.checkout.fillCustomerData(VALID_DATA)

      await expect(app.checkout.elements.terms).not.toBeChecked()
      await app.checkout.submit()

      await expect(app.checkout.elements.alerts.terms).toHaveText('Aceite os termos')
    })

  })

  test.describe('Pagamento e confirmação', () => {

    test.beforeEach(async ({ app }) => {
      await app.configurator.open()
    })

    test('deve criar um pedido com sucesso para pagamento à vista', async ({ page, app }) => {
      const CHECKOUT_CASH_DATA = {
        name: 'Bruce',
        lastname: 'Wayne',
        email: 'bruce.wayne@waynecorp.com',
        phone: '(11) 97777-6666',
        document: '780.228.290-05',
        store: 'Velô Paulista - Av. Paulista, 1000',
        totalPrice: 'R$ 40.000,00',
        color: 'Glacier Blue',
        wheels: 'Aero Wheels'
      }

      // Cleanup - API
      await deleteOrderByCPFDocument(CHECKOUT_CASH_DATA.document)

      // Arrange - Configurator
      await app.configurator.selectColor(CHECKOUT_CASH_DATA.color)
      await app.configurator.selectWheels(CHECKOUT_CASH_DATA.wheels)
      await app.configurator.expectPrice(CHECKOUT_CASH_DATA.totalPrice)
      await app.configurator.finishConfigurator()

      // Act - Checkout
      await app.checkout.expectLoaded()
      await app.checkout.fillCustomerData(CHECKOUT_CASH_DATA)
      await app.checkout.selectPaymentCash()

      await app.checkout.expectSummaryTotal(CHECKOUT_CASH_DATA.totalPrice)
      await expect(app.checkout.elements.paymentCash).toContainText(CHECKOUT_CASH_DATA.totalPrice)
      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert
      await app.orderStatus.assertStatus('Pedido Aprovado!')

      // Cleanup - API
      const orderNumber = await app.orderStatus.getOrderNumber()
      console.log(`Order number for cleanup: ${orderNumber}`)
      await deleteOrderByNumber(orderNumber)
    })

    test('deve aprovar o crédito quando o score do CPF for maior que 700 no financiamento', async ({ page, app }) => {
      const CHECKOUT_FINANCE_DATA = {
        name: 'Pedro',
        lastname: 'Pascal',
        email: 'pedro.pascal@themyscira.com',
        phone: '(11) 97777-6666',
        document: '956.250.790-48',
        store: 'Velô Paulista - Av. Paulista, 1000',
        totalPrice: 'R$ 42.000,00',
        totalPriceWithInterest: 'R$ 42.840,00',
        color: 'Lunar White',
        wheels: 'Sport Wheels'
      }

      // Cleanup - API
      await deleteOrderByCPFDocument(CHECKOUT_FINANCE_DATA.document)

      //Mock do Score
      await app.mock.setScore(701)

      // Arrange - Configurator
      await app.configurator.selectColor(CHECKOUT_FINANCE_DATA.color)
      await app.configurator.selectWheels(CHECKOUT_FINANCE_DATA.wheels)
      await app.configurator.expectPrice(CHECKOUT_FINANCE_DATA.totalPrice)
      await app.configurator.finishConfigurator()

      // Act - Checkout
      await app.checkout.expectLoaded()
      await app.checkout.fillCustomerData(CHECKOUT_FINANCE_DATA)
      await app.checkout.selectPaymentFinance()

      // await app.checkout.expectSummaryTotal(CHECKOUT_FINANCE_DATA.totalPriceWithInterest)
      // await expect(app.checkout.elements.paymentFinance).toContainText(CHECKOUT_FINANCE_DATA.totalPriceWithInterest)
      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert
      await app.orderStatus.assertStatus('Pedido Aprovado!')

      // Cleanup - API
      const orderNumber = await app.orderStatus.getOrderNumber()
      console.log(`Order number for cleanup: ${orderNumber}`)
      await deleteOrderByNumber(orderNumber)
    })

    test('deve enviar pedido para análise quando score do CPF for entre 501 e 700 no financiamento', async ({ page, app }) => {
      const CHECKOUT_FINANCE_ANALYSIS_DATA = {
        name: 'Clark',
        lastname: 'Kent',
        email: 'clark.kent@dailyplanet.com',
        phone: '(11) 98888-7777',
        document: '338.197.220-09',
        store: 'Velô Paulista - Av. Paulista, 1000',
        totalPrice: 'R$ 42.000,00',
        color: 'Lunar White',
        wheels: 'Sport Wheels'
      }

      // Cleanup - API
      await deleteOrderByCPFDocument(CHECKOUT_FINANCE_ANALYSIS_DATA.document)

      //Mock do Score
      await app.mock.setScore(600)

      // Arrange - Configurator
      await app.configurator.selectColor(CHECKOUT_FINANCE_ANALYSIS_DATA.color)
      await app.configurator.selectWheels(CHECKOUT_FINANCE_ANALYSIS_DATA.wheels)
      await app.configurator.expectPrice(CHECKOUT_FINANCE_ANALYSIS_DATA.totalPrice)
      await app.configurator.finishConfigurator()

      // Act - Checkout
      await app.checkout.expectLoaded()
      await app.checkout.fillCustomerData(CHECKOUT_FINANCE_ANALYSIS_DATA)
      await app.checkout.selectPaymentFinance()

      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert status visual de Pedido em Análise na página de sucesso
      await app.orderStatus.assertStatus('Pedido em Análise')
      const orderNumber = await app.orderStatus.getOrderNumber()

      // Assert status no order lookup
      await app.lookup.searchAndExpectStatus(orderNumber, 'EM_ANALISE')

      // Cleanup - API
      console.log(`Order number for cleanup: ${orderNumber}`)
      await deleteOrderByNumber(orderNumber)
    })

    test('deve enviar pedido para análise quando score do CPF for entre 501 e 700 no financiamento, com entrada menor que 50%', async ({ page, app }) => {
      const CHECKOUT_FINANCE_ANALYSIS_ENTRY_DATA = {
        name: 'Lois',
        lastname: 'Lane',
        email: 'lois.lane@dailyplanet.com',
        phone: '(11) 98888-7778',
        document: '443.643.510-59',
        store: 'Velô Paulista - Av. Paulista, 1000',
        totalPrice: 'R$ 42.000,00',
        color: 'Lunar White',
        wheels: 'Sport Wheels',
        entryValue: '10000'
      }

      // Cleanup - API
      await deleteOrderByCPFDocument(CHECKOUT_FINANCE_ANALYSIS_ENTRY_DATA.document)

      //Mock do Score
      await app.mock.setScore(600)

      // Arrange - Configurator
      await app.configurator.selectColor(CHECKOUT_FINANCE_ANALYSIS_ENTRY_DATA.color)
      await app.configurator.selectWheels(CHECKOUT_FINANCE_ANALYSIS_ENTRY_DATA.wheels)
      await app.configurator.expectPrice(CHECKOUT_FINANCE_ANALYSIS_ENTRY_DATA.totalPrice)
      await app.configurator.finishConfigurator()

      // Act - Checkout
      await app.checkout.expectLoaded()
      await app.checkout.fillCustomerData(CHECKOUT_FINANCE_ANALYSIS_ENTRY_DATA)
      await app.checkout.selectPaymentFinance()
      await app.checkout.fillDownPayment(CHECKOUT_FINANCE_ANALYSIS_ENTRY_DATA.entryValue)

      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert status visual de Pedido em Análise na página de sucesso
      await app.orderStatus.assertStatus('Pedido em Análise')
      const orderNumber = await app.orderStatus.getOrderNumber()

      // Assert status no order lookup
      await app.lookup.searchAndExpectStatus(orderNumber, 'EM_ANALISE')

      // Cleanup - API
      console.log(`Order number for cleanup: ${orderNumber}`)
      await deleteOrderByNumber(orderNumber)
    })

    test('deve reprovar o crédito quando o score do CPF for menor ou igual a 500 no financiamento', async ({ page, app }) => {
      const CHECKOUT_FINANCE_REJECTED_DATA = {
        name: 'Diana',
        lastname: 'Prince',
        email: 'diana.prince@themyscira.com',
        phone: '(11) 97777-6666',
        document: '390.533.447-05',
        store: 'Velô Paulista - Av. Paulista, 1000',
        totalPrice: 'R$ 42.000,00',
        color: 'Lunar White',
        wheels: 'Sport Wheels'
      }

      // Cleanup - API
      await deleteOrderByCPFDocument(CHECKOUT_FINANCE_REJECTED_DATA.document)

      //Mock do Score
      await app.mock.setScore(500)

      // Arrange - Configurator
      await app.configurator.selectColor(CHECKOUT_FINANCE_REJECTED_DATA.color)
      await app.configurator.selectWheels(CHECKOUT_FINANCE_REJECTED_DATA.wheels)
      await app.configurator.expectPrice(CHECKOUT_FINANCE_REJECTED_DATA.totalPrice)
      await app.configurator.finishConfigurator()

      // Act - Checkout
      await app.checkout.expectLoaded()
      await app.checkout.fillCustomerData(CHECKOUT_FINANCE_REJECTED_DATA)
      await app.checkout.selectPaymentFinance()

      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert status visual de Crédito Reprovado na página de sucesso
      await app.orderStatus.assertStatus('Crédito Reprovado')
      const orderNumber = await app.orderStatus.getOrderNumber()

      // Assert status no order lookup
      await app.lookup.searchAndExpectStatus(orderNumber, 'REPROVADO')

      // Cleanup - API
      console.log(`Order number for cleanup: ${orderNumber}`)
      await deleteOrderByNumber(orderNumber)
    })

    test('deve aprovar o crédito quando o score do CPF for entre 501 e 700 no financiamento, mas a entrada for igual a 50%', async ({ page, app }) => {
      const CHECKOUT_FINANCE_APPROVED_ENTRY_DATA = {
        name: 'Arthur',
        lastname: 'Curry',
        email: 'arthur.curry@atlantis.com',
        phone: '(11) 98888-7779',
        document: '708.694.870-51',
        store: 'Velô Paulista - Av. Paulista, 1000',
        totalPrice: 'R$ 42.000,00',
        color: 'Lunar White',
        wheels: 'Sport Wheels',
        entryValue: '21000'
      }

      // Cleanup - API
      await deleteOrderByCPFDocument(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.document)

      //Mock do Score
      await app.mock.setScore(600)

      // Arrange - Configurator
      await app.configurator.selectColor(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.color)
      await app.configurator.selectWheels(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.wheels)
      await app.configurator.expectPrice(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.totalPrice)
      await app.configurator.finishConfigurator()

      // Act - Checkout
      await app.checkout.expectLoaded()
      await app.checkout.fillCustomerData(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA)
      await app.checkout.selectPaymentFinance()
      await app.checkout.fillDownPayment(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.entryValue)

      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert status visual de Pedido Aprovado na página de sucesso
      await app.orderStatus.assertStatus('Pedido Aprovado!')
      const orderNumber = await app.orderStatus.getOrderNumber()

      // Assert status no order lookup
      await app.lookup.searchAndExpectStatus(orderNumber, 'APROVADO')

      // Cleanup - API
      console.log(`Order number for cleanup: ${orderNumber}`)
      await deleteOrderByNumber(orderNumber)
    })

    test('deve aprovar o crédito quando o score do CPF for menor do que 500 no financiamento, com entrada maior que 50%', async ({ page, app }) => {
      const CHECKOUT_FINANCE_APPROVED_ENTRY_DATA = {
        name: 'Bruce',
        lastname: 'Wayne',
        email: 'bruce.wayne@gotham.com',
        phone: '(11) 98888-7780',
        document: '381.772.630-99',
        store: 'Velô Paulista - Av. Paulista, 1000',
        totalPrice: 'R$ 42.000,00',
        color: 'Lunar White',
        wheels: 'Sport Wheels',
        entryValue: '30000'
      }

      // Cleanup - API
      await deleteOrderByCPFDocument(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.document)

      await app.mock.setScore(350)

      // Arrange - Configurator
      await app.configurator.selectColor(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.color)
      await app.configurator.selectWheels(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.wheels)
      await app.configurator.expectPrice(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.totalPrice)
      await app.configurator.finishConfigurator()

      // Act - Checkout
      await app.checkout.expectLoaded()
      await app.checkout.fillCustomerData(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA)
      await app.checkout.selectPaymentFinance()
      await app.checkout.fillDownPayment(CHECKOUT_FINANCE_APPROVED_ENTRY_DATA.entryValue)

      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert status visual de Pedido Aprovado na página de sucesso
      await app.orderStatus.assertStatus('Pedido Aprovado!')
      const orderNumber = await app.orderStatus.getOrderNumber()

      // Assert status no order lookup
      await app.lookup.searchAndExpectStatus(orderNumber, 'APROVADO')

      // Cleanup - API
      console.log(`Order number for cleanup: ${orderNumber}`)
      await deleteOrderByNumber(orderNumber)
    })

  })

})
