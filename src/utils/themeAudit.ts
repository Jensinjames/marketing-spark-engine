
/**
 * Theme Audit Utility
 * Helps identify and migrate hard-coded colors to semantic tokens
 */

export interface ColorAuditResult {
  file: string;
  line: number;
  hardcodedColor: string;
  suggestedToken: string;
  context: string;
}

export const SEMANTIC_COLOR_MAP: Record<string, string> = {
  // Purple variants -> Primary
  'bg-purple-600': 'bg-primary',
  'bg-purple-500': 'bg-primary-hover',
  'bg-purple-700': 'bg-primary-active',
  'text-purple-600': 'text-primary',
  'border-purple-600': 'border-primary',
  
  // Blue variants -> Info/Secondary
  'bg-blue-600': 'bg-info',
  'bg-blue-500': 'bg-info-hover',
  'text-blue-600': 'text-info',
  'border-blue-500': 'border-info',
  
  // Gray variants -> Muted/Surface
  'bg-gray-100': 'bg-surface',
  'bg-gray-200': 'bg-surface-elevated',
  'bg-gray-800': 'bg-surface dark:bg-surface-elevated',
  'text-gray-600': 'text-secondary',
  'text-gray-400': 'text-tertiary',
  'text-gray-800': 'text-primary',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  
  // Green variants -> Success
  'bg-green-100': 'bg-success-light',
  'bg-green-600': 'bg-success',
  'text-green-600': 'text-success',
  'border-green-500': 'border-success',
  
  // Red variants -> Error
  'bg-red-100': 'bg-error-light',
  'bg-red-600': 'bg-error',
  'text-red-600': 'text-error',
  'border-red-500': 'border-error',
  
  // Yellow variants -> Warning
  'bg-yellow-100': 'bg-warning-light',
  'bg-yellow-600': 'bg-warning',
  'text-yellow-600': 'text-warning',
  'border-yellow-500': 'border-warning',
};

export const generateColorMigrationSuggestions = (content: string, filename: string): ColorAuditResult[] => {
  const results: ColorAuditResult[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    Object.entries(SEMANTIC_COLOR_MAP).forEach(([hardcoded, semantic]) => {
      if (line.includes(hardcoded)) {
        results.push({
          file: filename,
          line: index + 1,
          hardcodedColor: hardcoded,
          suggestedToken: semantic,
          context: line.trim(),
        });
      }
    });
  });
  
  return results;
};

export const applyColorMigration = (content: string): string => {
  let migratedContent = content;
  
  Object.entries(SEMANTIC_COLOR_MAP).forEach(([hardcoded, semantic]) => {
    const regex = new RegExp(hardcoded, 'g');
    migratedContent = migratedContent.replace(regex, semantic);
  });
  
  return migratedContent;
};
