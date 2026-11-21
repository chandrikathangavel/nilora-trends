/**
 * Validates and sanitizes redirect destinations to prevent open-redirect vulnerabilities.
 * Ensures the target is strictly an internal, relative application path.
 */
export function getSafeRedirectUrl(target: string | null | undefined, defaultUrl = '/profile'): string {
  if (!target || typeof target !== 'string') {
    return defaultUrl;
  }

  const trimmed = target.trim();

  // Must begin with a single slash, not a double slash or backslash (which could indicate a protocol-relative external URL)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return defaultUrl;
  }

  // Reject URLs containing protocols or script execution schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('data:') ||
    lower.includes('vbscript:') ||
    lower.includes('http:') ||
    lower.includes('https:') ||
    lower.includes('\\')
  ) {
    return defaultUrl;
  }

  // Reject newlines or control characters that could facilitate HTTP header injection
  if (/[\r\n\t\0]/.test(trimmed)) {
    return defaultUrl;
  }

  return trimmed;
}
