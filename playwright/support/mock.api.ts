import {Page} from '@playwright/test'

    /**
     * Mocka a API de analise de credito retornando o score informado.
     * Usado em cenarios de checkout com financiamento.
     * @param score valor do score a ser retornado na resposta da API (ex: 500, 600, 700)
     */
    export const setScoreMock = async (page: Page, score: number) => {
      await page.route('**/functions/v1/credit-analysis', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'Done',
            score: score
          })
        })
      })
    }



