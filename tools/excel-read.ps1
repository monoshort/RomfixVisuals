$xlsx = "C:\Users\Bernt-JanBosma(Yenlo\src\RomfixVisuals\sterkteberekingen funderingswapening Romfix.xlsx"
$excel = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
$wb = $excel.Workbooks | Where-Object { $_.FullName -eq $xlsx } | Select-Object -First 1
$cells = @("B12","B13","B14","C13","C14","C15","B19","B20","D19","D20","E19","E20","F13","E13","E14","D13","D14")
foreach ($name in @("Capping_Romfix","RoadBase_Romfix")) {
  Write-Host "=== $name ==="
  $s = $wb.Sheets.Item($name)
  foreach ($c in $cells) {
    Write-Host "$c = $($s.Range($c).Text)"
  }
}