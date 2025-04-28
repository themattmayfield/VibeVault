export const getSubdomain = async (request: Request | undefined) => {
  const url = new URL(request?.url || '');
  const hostname = url.hostname;
  const parts = hostname.split('.');

  // Handle plain localhost explicitly
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // No subdomain for plain localhost
  }

  // Handle *.localhost (e.g., sub.localhost)
  if (hostname.endsWith('.localhost') && parts.length === 2) {
    return parts[0]; // Returns "sub" from "sub.localhost"
  }

  // For sub.example.com, check if there's a subdomain
  if (parts.length >= 3) {
    return parts[0]; // Returns "sub" from "sub.example.com"
  }

  return null; // No subdomain
};
