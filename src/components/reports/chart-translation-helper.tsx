"use client";

import { TranslatedText } from "@/components/language/translated-text";

/**
 * Helper function to check if a string is a translation key and return the translated text
 * Translation keys are in the format "namespace.key", e.g. "reports.sales"
 */
export function getTranslatedLabel(label: string): React.ReactNode {
  if (typeof label === 'string' && label.includes('.')) {
    const [namespace, key] = label.split('.');
    if (namespace && key) {
      return <TranslatedText namespace={namespace} id={key} />;
    }
  }
  return label;
}

/**
 * Helper function to get a formatted name for chart legends and tooltips
 * If the label is a translation key, it will be translated
 */
export function getFormattedName(label: string): string {
  if (typeof label === 'string' && label.includes('.')) {
    // For translation keys, we need to return the original key
    // The actual translation will be handled by the Legend formatter
    return label;
  }
  return label;
}
