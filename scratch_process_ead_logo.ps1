Add-Type -AssemblyName System.Drawing
$filePath = "C:\Users\Catalina\OneDrive\Documentos\Zona-inestable---Catalina-Cabezas\assets\logo ead.png"
$img = [System.Drawing.Bitmap]::FromFile($filePath)
$newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)

for ($y = 0; $y -lt $img.Height; $y++) {
    for ($x = 0; $x -lt $img.Width; $x++) {
        $p = $img.GetPixel($x, $y)
        # If the pixel is white-ish (R, G, B all greater than 200) and not transparent
        if ($p.A -gt 10 -and $p.R -gt 200 -and $p.G -gt 200 -and $p.B -gt 200) {
            # Convert to black (preserve original alpha transparency)
            $newColor = [System.Drawing.Color]::FromArgb($p.A, 0, 0, 0)
            $newImg.SetPixel($x, $y, $newColor)
        } else {
            # Keep original pixel (such as the red brackets)
            $newImg.SetPixel($x, $y, $p)
        }
    }
}

$img.Dispose()
$tempPath = "C:\Users\Catalina\OneDrive\Documentos\Zona-inestable---Catalina-Cabezas\assets\logo_ead_temp.png"
$newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
$newImg.Dispose()

Remove-Item $filePath -Force
Rename-Item $tempPath (Split-Path $filePath -Leaf)
Write-Output "Successfully converted white text to black in logo ead.png!"
