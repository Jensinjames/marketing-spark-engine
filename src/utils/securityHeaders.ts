
// Security Headers Utility
export const addSecurityHeaders = () => {
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://supabase.co https://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://supabase.co https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  // Create meta tag for CSP
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = cspDirectives;
  
  // Remove existing CSP meta tag if present
  const existingCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCsp) {
    existingCsp.remove();
  }
  
  document.head.appendChild(cspMeta);

  // Add other security meta tags
  const securityTags = [
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { httpEquiv: 'X-Frame-Options', content: 'DENY' },
    { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
    { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
    { httpEquiv: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' }
  ];

  securityTags.forEach(({ httpEquiv, content }) => {
    const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
    if (existing) {
      existing.remove();
    }
    
    const meta = document.createElement('meta');
    meta.httpEquiv = httpEquiv;
    meta.content = content;
    document.head.appendChild(meta);
  });
};

// Initialize security headers on app start
export const initializeSecurity = () => {
  addSecurityHeaders();
  
  // Disable right-click context menu in production
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Disable common developer shortcuts in production
  if (import.meta.env.PROD) {
    document.addEventListener('keydown', (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.key === 'F12')
      ) {
        e.preventDefault();
      }
    });
  }
};
