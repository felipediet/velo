param(
  # Nome da imagem Docker usada para executar os testes E2E.
  [string]$ImageName = "velo-web:e2e",
  # Nome do container temporario criado durante a execucao.
  [string]$ContainerName = "velo-web",
  # Porta local exposta para acessar a aplicacao dentro do container.
  [int]$Port = 5173,
  # Tempo maximo de espera ate a aplicacao responder no navegador.
  [int]$MaxWaitSeconds = 90,
  # Permite pular a instalacao de dependencias quando elas ja estao prontas.
  [switch]$SkipInstall,
  # Mantem o container ao final para inspecao manual.
  [switch]$KeepContainer,
  # Abre o relatorio do Playwright ao concluir os testes.
  [switch]$ShowReport
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Garante que os comandos externos necessarios estao disponiveis no ambiente.
function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando nao encontrado: $Name"
  }
}

# Executa uma etapa nomeada e exibe o progresso no console.
function Invoke-Step {
  param(
    [string]$Title,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  & $Action
}

# Remove o container somente se ele existir, evitando erro em execucoes repetidas.
function Remove-ContainerIfExists {
  param([string]$Name)

  $existingContainer = docker container ls -a --filter "name=^/${Name}$" --format "{{.Names}}"
  if ($existingContainer -contains $Name) {
    docker rm -f $Name | Out-Null
  }
}

# Resolve a pasta raiz do projeto a partir da localizacao do script.
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Push-Location $projectRoot
try {
  # Valida que Docker e Corepack estao instalados antes de iniciar o fluxo.
  Assert-Command "docker"
  Assert-Command "corepack"

  # Remove uma execucao anterior para evitar conflito de nome de container.
  Invoke-Step "Limpando container antigo (se existir)" {
    Remove-ContainerIfExists -Name $ContainerName
  }

  # Constrói a imagem Docker que contem a aplicacao e o ambiente de testes.
  Invoke-Step "Build da imagem Docker" {
    docker build -t $ImageName .
  }

  # Inicia o container em background expondo a porta configurada.
  Invoke-Step "Subindo container" {
    docker run -d --name $ContainerName -p "${Port}:5173" $ImageName | Out-Host
  }

  # Aguarda a aplicacao ficar disponivel antes de rodar os testes.
  Invoke-Step "Aguardando aplicacao responder" {
    $url = "http://localhost:$Port/"
    $startedAt = Get-Date
    $ready = $false

    # Faz tentativas periodicas ate a aplicacao responder ou o tempo expirar.
    while (((Get-Date) - $startedAt).TotalSeconds -lt $MaxWaitSeconds) {
      try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
          $ready = $true
          break
        }
      }
      catch {
      }

      Start-Sleep -Seconds 2
    }

    if (-not $ready) {
      # Em caso de timeout, mostra os logs do container para diagnostico.
      Write-Host "Aplicacao nao ficou pronta a tempo. Logs do container:" -ForegroundColor Yellow
      docker logs $ContainerName
      throw "Falha ao aguardar aplicacao em $url"
    }

    Write-Host "Aplicacao pronta em $url" -ForegroundColor Green
  }

  # Instala dependencias e browsers do Playwright quando a opcao nao for pulada.
  if (-not $SkipInstall) {
    Invoke-Step "Instalando dependencias" {
      yarn install --frozen-lockfile
      yarn playwright install --with-deps
    }
  }
  else {
    # Informa que a instalacao foi ignorada por parametro explicito.
    Write-Host ""
    Write-Host "==> Pulando instalacao de dependencias por parametro -SkipInstall" -ForegroundColor Yellow
  }

  # Executa a suite Playwright dentro do ambiente preparado.
  Invoke-Step "Executando testes Playwright" {
    yarn playwright show-report
  }

  # Abre o relatorio do Playwright quando solicitado.
  if ($ShowReport) {
    Invoke-Step "Abrindo relatorio Playwright" {
      yarn playwright show-report
    }
  }

  # Confirma que a rotina terminou sem erros.
  Write-Host ""
  Write-Host "Concluido com sucesso." -ForegroundColor Green
}
catch {
  # Exibe a mensagem do erro capturado antes de re-lancar a excecao.
  Write-Host ""
  Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
  throw
}
finally {
  # Remove o container ao final, a menos que o usuario tenha solicitado manutencao.
  if (-not $KeepContainer) {
    Write-Host ""
    Write-Host "==> Removendo container" -ForegroundColor Cyan
    Remove-ContainerIfExists -Name $ContainerName
  }
  else {
    # Mantem o container ativo para inspecao manual e depuracao.
    Write-Host ""
    Write-Host "Container mantido por parametro -KeepContainer: $ContainerName" -ForegroundColor Yellow
  }

  # Restaura o diretorio original do terminal.
  Pop-Location
}
