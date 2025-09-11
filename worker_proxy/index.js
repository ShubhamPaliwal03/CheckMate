export default {

  async fetch(request) {

    try {

      const url = new URL(request.url);

      // Example: /?target=https://example.com

      const target = url.searchParams.get("target");

      if (!target) {
        
        return new Response("Bad Request: target query param missing", { status: 400 });
      }

      // Decode in case the URL is encoded
      const decodedTarget = decodeURIComponent(target);

      let upstream;
      
      try {

        upstream = await fetch(decodedTarget, {

            method: "GET",
            redirect: "follow", // follow redirects automatically
            headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": decodedTarget.split("/").slice(0,3).join("/") // send base URL as referer
            },
            cf: {
            cacheEverything: true // optional, speeds up repeated requests
            }

        });

      } catch (err) {

        return new Response("Network Error fetching target", { status: 502 });
      }

      // Handle known error codes explicitly

      if (!upstream.ok) {

        switch (upstream.status) {

          case 400: return new Response("400 Bad Request from target", { status: 400 });
          case 401: return new Response("401 Unauthorized from target", { status: 401 });
          case 402: return new Response("402 Payment Required from target", { status: 402 });
          case 403: return new Response("403 Forbidden from target", { status: 403 });
          case 404: return new Response("404 Not Found from target", { status: 404 });
          case 408: return new Response("408 Request Timeout from target", { status: 408 });

          case 429: {

            const retryAfter = upstream.headers.get("Retry-After");

            return new Response(

              retryAfter
                ? `429 Too Many Requests - retry after ${retryAfter} seconds`
                : "429 Too Many Requests",

              { status: 429 }
            );
          }
          case 500: return new Response("500 Internal Server Error from target", { status: 500 });
          case 501: return new Response("501 Not Implemented from target", { status: 501 });
          case 502: return new Response("502 Bad Gateway from target", { status: 502 });
          case 503: return new Response("503 Service Unavailable from target", { status: 503 });
          case 504: return new Response("504 Gateway Timeout from target", { status: 504 });
          case 505: return new Response("505 HTTP Version Not Supported from target", { status: 505 });

          default:
            
            return new Response(

              `Unexpected error: ${upstream.status} - ${upstream.statusText}`,

              { status: upstream.status }
            );
        }
      }

      // If everything is OK, pass back the response body

      const body = await upstream.text();

      return new Response(body, {

        status: 200,
        headers: {

          "Content-Type": "text/html; charset=UTF-8",
          "Access-Control-Allow-Origin": "*", // allow frontend
        },
      });

    } catch (err) {
        
      return new Response("Unexpected Worker error: " + err.message, { status: 500 });
    }
  }
};