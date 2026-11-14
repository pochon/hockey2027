<#
.SYNOPSIS
  Optimiza fotos para la galería de Hockey Santa Fe 2027.

.DESCRIPTION
  Toma todas las imágenes de una carpeta (por ejemplo img\Costanera),
  genera una versión JPEG para el visor y una miniatura para el carrusel,
  y muestra por pantalla el JSON listo para pegar en data/contenido.json.

.EJEMPLO
  powershell -ExecutionPolicy Bypass -File tools\optimizar-fotos.ps1 `
      -Origen "img\Costanera" -Prefijo "costanera" -Capitulo "Capítulo 1"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Origen,

    [Parameter(Mandatory = $true)]
    [string]$Prefijo,

    [string]$Capitulo = "Capítulo 1",
    [string]$Destino = "assets\img\eventos",
    [int]$Calidad = 85,
    [int]$AnchoMax = 1600,
    [int]$AnchoMiniatura = 640
)

Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$carpetaOrigen = Join-Path $raiz $Origen
$carpetaDestino = Join-Path $raiz $Destino
$carpetaMiniaturas = Join-Path $carpetaDestino 'thumbs'

if (-not (Test-Path $carpetaOrigen)) {
    Write-Error "No existe la carpeta de origen: $carpetaOrigen"
    exit 1
}

New-Item -ItemType Directory -Force -Path $carpetaDestino | Out-Null
New-Item -ItemType Directory -Force -Path $carpetaMiniaturas | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Jpeg {
    param(
        [System.Drawing.Image]$Imagen,
        [string]$Ruta,
        [int]$Calidad
    )

    $parametros = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $parametros.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality,
        [long]$Calidad
    )
    $Imagen.Save($Ruta, $codec, $parametros)
    $parametros.Dispose()
}

function New-Redimensionada {
    param(
        [System.Drawing.Image]$Imagen,
        [int]$AnchoObjetivo
    )

    if ($Imagen.Width -le $AnchoObjetivo) {
        $ancho = $Imagen.Width
    } else {
        $ancho = $AnchoObjetivo
    }

    $alto = [int][math]::Round($Imagen.Height * ($ancho / $Imagen.Width))

    $nueva = New-Object System.Drawing.Bitmap($ancho, $alto)
    $g = [System.Drawing.Graphics]::FromImage($nueva)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($Imagen, 0, 0, $ancho, $alto)
    $g.Dispose()

    return $nueva
}

$archivos = Get-ChildItem -Path $carpetaOrigen -File |
    Where-Object { $_.Extension -match '^\.(jpe?g|png|webp|bmp)$' } |
    Sort-Object Name

if (-not $archivos) {
    Write-Error "No se encontraron imágenes en $carpetaOrigen"
    exit 1
}

$indice = 0
$entradas = @()

foreach ($archivo in $archivos) {
    $indice++
    $numero = '{0:D2}' -f $indice
    $nombre = "$Prefijo-$numero.jpg"

    $imagen = [System.Drawing.Image]::FromFile($archivo.FullName)

    try {
        $grande = New-Redimensionada -Imagen $imagen -AnchoObjetivo $AnchoMax
        $rutaGrande = Join-Path $carpetaDestino $nombre
        Save-Jpeg -Imagen $grande -Ruta $rutaGrande -Calidad $Calidad
        $anchoFinal = $grande.Width
        $altoFinal = $grande.Height
        $grande.Dispose()

        $mini = New-Redimensionada -Imagen $imagen -AnchoObjetivo $AnchoMiniatura
        $rutaMini = Join-Path $carpetaMiniaturas $nombre
        Save-Jpeg -Imagen $mini -Ruta $rutaMini -Calidad 80
        $mini.Dispose()
    }
    finally {
        $imagen.Dispose()
    }

    $rutaRelativa = ($Destino -replace '\\', '/') + '/' + $nombre
    $rutaMiniRelativa = ($Destino -replace '\\', '/') + '/thumbs/' + $nombre

    $entradas += [pscustomobject]@{
        capitulo   = $Capitulo
        titulo     = ""
        descripcion = ""
        imagen     = $rutaRelativa
        miniatura  = $rutaMiniRelativa
        ancho      = $anchoFinal
        alto       = $altoFinal
        alt        = ""
    }

    "{0,-32} -> {1} ({2}x{3})" -f $archivo.Name, $rutaRelativa, $anchoFinal, $altoFinal
}

"`n--- Pegar en data/contenido.json (completar titulo, descripcion y alt) ---`n"
$entradas | ConvertTo-Json -Depth 3
