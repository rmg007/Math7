# PowerShell script to batch-fix remaining TypeScript any violations
# Run from project root

Write-Host "Fixing TypeScript 'any' violations..." -ForegroundColor Cyan

# Fix question-list.tsx - Replace interface and any usages
$file = "admin-panel/src/features/curriculum/components/question-list.tsx"

$content = Get-Content $file -Raw

# Add import for QuestionListItem
$content = $content -replace "^(import.*?;\r?\n)", "`$1import type { QuestionListItem } from '@/types/common.types';`r`n"

# Replace local Question interface
$content = $content -replace "interface Question \{[^}]+\}", "// QuestionListItem type imported from common.types"

# Replace all (q: any) => with (q: QuestionListItem) =>
$content = $content -replace "\(q: any\)", "(q: QuestionListItem)"

# Replace all (question: any) => with (question: QuestionListItem) =>
$content = $content -replace "\(question: any,", "(question: QuestionListItem,"

# Replace (skill: any) => with proper type
$content = $content -replace "\(skill: any\)", "(skill: { id: string; title: string })"

# Replace parseField any
$content = $content -replace "const parseField = \(field: any\)", "const parseField = (field: unknown)"

Set-Content $file $content -NoNewline

Write-Host "✓ Fixed question-list.tsx" -ForegroundColor Green

# Fix question-form.tsx
$file = "admin-panel/src/features/curriculum/components/question-form.tsx"
$content = Get-Content $file -Raw

# Add interface for question options
$interfaceInsert = @"
interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface ReorderStep {
  id: string;
  text: string;
  correctOrder: number;
}

"@

$content = $content -replace "^(import.*?\r?\n\r?\n)", "`$1$interfaceInsert"

# Replace sol: any
$content = $content -replace "let sol: any;", "let sol: unknown;"

# Replace setOptions parameter
$content = $content -replace "const setOptions = \(newOptions: any\[\]\)", "const setOptions = (newOptions: QuestionOption[])"

# Replace setSteps parameter
$content = $content -replace "const setSteps = \(newSteps: any\[\]\)", "const setSteps = (newSteps: ReorderStep[])"

# Replace (opt: any, index: number)
$content = $content -replace "\(opt: any, index: number\)", "(opt: QuestionOption, index: number)"

# Replace (step: any, index: number)
$content = $content -replace "\(step: any, index: number\)", "(step: ReorderStep, index: number)"

# Replace (s: any)
$content = $content -replace "\(s: any\) =>", "(s: ReorderStep) =>"

Set-Content $file $content -NoNewline

Write-Host "✓ Fixed question-form.tsx" -ForegroundColor Green

# Fix GovernancePage.tsx
$file = "admin-panel/src/features/ai-assistant/pages/GovernancePage.tsx"
$content = Get-Content $file -Raw
$content = $content -replace "\(q: any\)", "(q: Record<string, unknown>)"
Set-Content $file $content -NoNewline

Write-Host "✓ Fixed GovernancePage.tsx" -ForegroundColor Green

# Fix GenerationPage.tsx
$file = "admin-panel/src/features/ai-assistant/pages/GenerationPage.tsx"
$content = Get-Content $file -Raw
$content = $content -replace "\(skill: any\)", "(skill: { id: string; title: string })"
Set-Content $file $content -NoNewline

Write-Host "✓ Fixed GenerationPage.tsx" -ForegroundColor Green

# Fix DocumentUploader.tsx
$file = "admin-panel/src/features/ai-assistant/components/DocumentUploader.tsx"
$content = Get-Content $file -Raw
$content = $content -replace "\.map\(\(item: any\) =>", ".map((item: { str: string }) =>"
Set-Content $file $content -NoNewline

Write-Host "✓ Fixed DocumentUploader.tsx" -ForegroundColor Green

Write-Host "`nAll files fixed! Running TypeScript check..." -ForegroundColor Cyan
cd admin-panel
npx tsc --noEmit
