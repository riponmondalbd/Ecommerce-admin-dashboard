/**
 * Vercel Serverless Function — API Proxy
 *
 * Proxies all /api/* requests to the backend server.
 * This allows the Next.js frontend (deployed on Vercel) to communicate
 * with the backend (deployed separately on Railway/Render/etc).
 *
 * Set BACKEND_URL environment variable in Vercel dashboard:
 *   BACKEND_URL=https://your-backend.onrender.com
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export default async function handler(request, response) {
  const { method, url: reqUrl, headers, body } = request;

  // Parse the request path and strip the /api prefix
  const url = new URL(reqUrl, 'http://localhost');
  const backendPath = url.pathname; // e.g., /products/123

  // Build the full backend URL
  const backendUrl = `${BACKEND_URL}${backendPath}`;

  // Log for debugging
  console.log(`[Proxy] ${method} ${backendPath} -> ${backendUrl}`);

  try {
    // Forward the request to the backend
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        // Remove hop-by-hop headers
        'host': new URL(BACKEND_URL).host,
        'connection': 'close',
      },
      // Only include body for methods that support it
      ...(body && ['POST', 'PUT', 'PATCH'].includes(method) ? { body } : {}),
    };

    const res = await fetch(backendUrl, fetchOptions);
    const data = await res.text();

    // Forward the response
    response.status(res.status).json(JSON.parse(data));
  } catch (error) {
    console.error('[Proxy] Error:', error.message);
    response.status(502).json({
      success: false,
      message: 'Bad Gateway: Failed to reach backend server',
      error: error.message,
    });
  }
}
