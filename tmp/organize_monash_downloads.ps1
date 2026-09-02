param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$downloadsRoot = [IO.Path]::GetFullPath('C:\Users\vishw\Downloads')
$targetRoot = [IO.Path]::GetFullPath('C:\Users\vishw\Vish\MonashUni')
$expectedTargetRoot = [IO.Path]::GetFullPath('C:\Users\vishw\Vish\MonashUni')

if ($targetRoot -ne $expectedTargetRoot) {
    throw "Target root mismatch: $targetRoot"
}
if (-not (Test-Path -LiteralPath $downloadsRoot -PathType Container)) {
    throw "Downloads folder not found: $downloadsRoot"
}
if (-not (Test-Path -LiteralPath $targetRoot -PathType Container)) {
    throw "Target folder not found: $targetRoot"
}

$pythonFolder = 'ITO4133 - Introduction to Python TP2-26'
$aiFolder = 'ITO5047 - Fundamentals of Artificial Intelligence'
$optimisationFolder = 'ITO5216 - Discrete Optimisation'

$moves = @(
    [pscustomobject]@{ Source = 'Monash Online Student Enrolment Form.pdf'; Folder = ''; Destination = 'Monash Online - Student Enrolment Form.pdf' }
    [pscustomobject]@{ Source = '37297228_Fees_2026.pdf'; Folder = ''; Destination = 'Monash University - Fees Statement 2026 - Student 37297228.pdf' }

    [pscustomobject]@{ Source = 'graph (1).csv'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - graph.csv' }
    [pscustomobject]@{ Source = 'h_sld.csv'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - h_sld.csv' }
    [pscustomobject]@{ Source = 'h_zero.csv'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - h_zero.csv' }
    [pscustomobject]@{ Source = 'ITO5047 Assessment 1 Modules 12 question sheet (1).pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - Modules 1 and 2 - Question Sheet.pdf' }
    [pscustomobject]@{ Source = 'ITO5047_A1_Answer_Sheet_FILLED.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - Answer Sheet Filled v1.docx' }
    [pscustomobject]@{ Source = 'ITO5047_A1_Answer_Sheet_FILLED_1.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - Answer Sheet Filled v2.docx' }
    [pscustomobject]@{ Source = 'Question_4_Alpha_Beta_Updated_Diagram.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - Question 4 Alpha-Beta Updated Diagram.docx' }
    [pscustomobject]@{ Source = 'Assessment 1 answer sheet template.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - Answer Sheet Template.docx' }
    [pscustomobject]@{ Source = 'Vish Joshi_37297228_Assessment1_ITO5047.pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - Submission.pdf' }
    [pscustomobject]@{ Source = 'Vish Joshi_37297228_Assessment1_ITO5047 (1).pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 1 - Submission Copy.pdf' }

    [pscustomobject]@{ Source = 'ITO5047 Assessment 2.pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Question Sheet.pdf' }
    [pscustomobject]@{ Source = 'Q3ab-BN-rental2.dne'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Q3ab BN Rental 2.dne' }
    [pscustomobject]@{ Source = 'Q1a-BN-SmokeAlarm.dne'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Q1a BN Smoke Alarm.dne' }
    [pscustomobject]@{ Source = 'Q3c-BN-rental3.dne'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Q3c BN Rental 3.dne' }
    [pscustomobject]@{ Source = 'Assessment 2 answer sheet template.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Answer Sheet Template.docx' }
    [pscustomobject]@{ Source = 'Joshi_StudentNumber_Assessment2.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Draft Template.docx' }
    [pscustomobject]@{ Source = 'Vish Joshi_37297228_Assessment2.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Vish Joshi 37297228 v1.docx' }
    [pscustomobject]@{ Source = 'Joshi_37297228_Assessment2.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Vish Joshi 37297228 v2.docx' }
    [pscustomobject]@{ Source = 'Joshi_37297228_Assessment2.pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Submission.pdf' }
    [pscustomobject]@{ Source = 'Joshi_37297228_Assessment2 (1).pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 2 - Submission Copy.pdf' }

    [pscustomobject]@{ Source = 'Assessment 3 answer sheet template.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Answer Sheet Template.docx' }
    [pscustomobject]@{ Source = 'Assessment 3 Modules 45 question sheet.pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Modules 4 and 5 - Question Sheet.pdf' }
    [pscustomobject]@{ Source = 'postoperative-patient-data_simplified - Copy.arff'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Postoperative Patient Data Copy.arff' }
    [pscustomobject]@{ Source = 'postoperative-patient-data_simplified.arff'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Postoperative Patient Data.arff' }
    [pscustomobject]@{ Source = 'tic-tac-toe.arff'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Tic-Tac-Toe Data.arff' }
    [pscustomobject]@{ Source = 'abs.arff'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - ABS Data.arff' }
    [pscustomobject]@{ Source = 'A3-abs.xlsx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - ABS Workbook v1.xlsx' }
    [pscustomobject]@{ Source = 'A3-Q2-2-b-ii-test-dataset.arff'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Q2-2-b-ii Test Dataset.arff' }
    [pscustomobject]@{ Source = 'Joshi_StudentNumber_Assessment3.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Draft Template.docx' }
    [pscustomobject]@{ Source = '~$shi_StudentNumber_Assessment3.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Temporary Word Lock File.docx' }
    [pscustomobject]@{ Source = 'postoperative_patient_test.arff'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Postoperative Patient Test Data.arff' }
    [pscustomobject]@{ Source = 'tic-tac-toe-test.arff'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Tic-Tac-Toe Test Data.arff' }
    [pscustomobject]@{ Source = 'abs.xlsx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - ABS Workbook v2.xlsx' }
    [pscustomobject]@{ Source = 'Assessment 3.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Working Copy.docx' }
    [pscustomobject]@{ Source = 'Vishwas_Joshi_37297228_Assessment_3_Final.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Vishwas Joshi 37297228 Final.docx' }
    [pscustomobject]@{ Source = 'Vishwas_Joshi_37297228_Assessment_3.docx'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Vishwas Joshi 37297228.docx' }
    [pscustomobject]@{ Source = 'Vishwas_Joshi_37297228_Assessment_3.pdf'; Folder = $aiFolder; Destination = 'ITO5047 - Assessment 3 - Submission.pdf' }
    [pscustomobject]@{ Source = 'Module_6__Topic_1_–_Artificial_neural_networks.epub'; Folder = $aiFolder; Destination = 'ITO5047 - Module 6 - Topic 1 - Artificial Neural Networks.epub' }
    [pscustomobject]@{ Source = 'Module_6__Topic_2_–_Deep_ANNs.epub'; Folder = $aiFolder; Destination = 'ITO5047 - Module 6 - Topic 2 - Deep ANNs.epub' }

    [pscustomobject]@{ Source = 'Assessment 1 Pipe routing.zip'; Folder = $optimisationFolder; Destination = 'ITO5216 - Assessment 1 - Pipe Routing.zip' }
    [pscustomobject]@{ Source = '03 powergen.pdf'; Folder = $optimisationFolder; Destination = 'ITO5216 - Exercise 03 - PowerGen.pdf' }
    [pscustomobject]@{ Source = 'Cryptarithm.zip'; Folder = $optimisationFolder; Destination = 'ITO5216 - Cryptarithm.zip' }
    [pscustomobject]@{ Source = 'MiniZincIDE-2.10.1-x86_64-windows-setup.exe'; Folder = $optimisationFolder; Destination = 'MiniZinc IDE 2.10.1 Windows Installer.exe' }
    [pscustomobject]@{ Source = 'PowerGen.zip'; Folder = $optimisationFolder; Destination = 'ITO5216 - PowerGen.zip' }
    [pscustomobject]@{ Source = 'PowerGen'; Folder = $optimisationFolder; Destination = 'PowerGen' }
    [pscustomobject]@{ Source = '07 retailroster.pdf'; Folder = $optimisationFolder; Destination = 'ITO5216 - Exercise 07 - Retail Roster.pdf' }
    [pscustomobject]@{ Source = 'RetailRoster.zip'; Folder = $optimisationFolder; Destination = 'ITO5216 - Retail Roster.zip' }
    [pscustomobject]@{ Source = 'RetailRoster'; Folder = $optimisationFolder; Destination = 'RetailRoster' }
)

$folderNames = @($pythonFolder, $aiFolder, $optimisationFolder)
$preflight = foreach ($move in $moves) {
    $sourcePath = [IO.Path]::GetFullPath((Join-Path $downloadsRoot $move.Source))
    $destinationFolder = if ([string]::IsNullOrEmpty($move.Folder)) { $targetRoot } else { Join-Path $targetRoot $move.Folder }
    $destinationPath = [IO.Path]::GetFullPath((Join-Path $destinationFolder $move.Destination))

    if (-not $sourcePath.StartsWith($downloadsRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Source escaped Downloads: $sourcePath"
    }
    if (-not $destinationPath.StartsWith($targetRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Destination escaped target root: $destinationPath"
    }
    $sourceExists = Test-Path -LiteralPath $sourcePath
    $destinationExists = Test-Path -LiteralPath $destinationPath
    if ($sourceExists -and $destinationExists) {
        throw "Both source and destination exist: $sourcePath -> $destinationPath"
    }
    if (-not $sourceExists -and -not $destinationExists) {
        throw "Neither source nor destination exists: $sourcePath -> $destinationPath"
    }
    $state = if ($sourceExists) { 'Pending' } else { 'Completed' }

    [pscustomobject]@{
        Source = $sourcePath
        DestinationFolder = $destinationFolder
        Destination = $destinationPath
        State = $state
    }
}

$duplicates = $preflight | Group-Object Destination | Where-Object Count -gt 1
if ($duplicates) {
    throw "Duplicate destination paths detected."
}

if ($DryRun) {
    [pscustomobject]@{
        Mode = 'DryRun'
        FolderCount = $folderNames.Count
        MoveCount = $preflight.Count
        PendingCount = @($preflight | Where-Object State -eq 'Pending').Count
        CompletedCount = @($preflight | Where-Object State -eq 'Completed').Count
        TargetRoot = $targetRoot
    } | ConvertTo-Json
    exit 0
}

foreach ($folderName in $folderNames) {
    $folderPath = [IO.Path]::GetFullPath((Join-Path $targetRoot $folderName))
    if (-not $folderPath.StartsWith($targetRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Folder escaped target root: $folderPath"
    }
    New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
}

$failures = @()
foreach ($item in ($preflight | Where-Object State -eq 'Pending')) {
    try {
        Move-Item -LiteralPath $item.Source -Destination $item.Destination
    }
    catch {
        $failures += [pscustomobject]@{
            Source = $item.Source
            Destination = $item.Destination
            Error = $_.Exception.Message
        }
    }
}

[pscustomobject]@{
    Mode = 'Moved'
    FolderCount = $folderNames.Count
    MoveCount = $preflight.Count
    RemainingSources = @($preflight | Where-Object { Test-Path -LiteralPath $_.Source }).Count
    DestinationsPresent = @($preflight | Where-Object { Test-Path -LiteralPath $_.Destination }).Count
    FailedCount = $failures.Count
    Failures = $failures
    TargetRoot = $targetRoot
} | ConvertTo-Json
