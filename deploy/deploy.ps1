param(
    [Parameter(Mandatory = $true)]
    [string]$Target
)

$ErrorActionPreference = 'Stop'

$jar = Join-Path $PSScriptRoot '..\be\target\be-0.0.1-SNAPSHOT.jar'
if (-not (Test-Path -LiteralPath $jar)) {
    throw "JAR nao encontrado. Rode: cd be; .\mvnw.cmd -DskipTests package"
}

scp $jar "${Target}:/tmp/contela-app.jar"
if ($LASTEXITCODE -ne 0) { throw "scp falhou" }

ssh $Target "sudo install -o contela -g contela -m 644 /tmp/contela-app.jar /opt/contela/app.jar && sudo systemctl restart contela && sleep 5 && curl -fsS http://127.0.0.1:8080/saude"
if ($LASTEXITCODE -ne 0) { throw "deploy falhou" }
