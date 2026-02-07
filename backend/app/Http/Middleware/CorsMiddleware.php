<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->getMethod() === 'OPTIONS') {
            return $this->handlePreflight($request);
        }

        $response = $next($request);

        return $this->addCorsHeaders($response);
    }

    private function handlePreflight(Request $request): Response
    {
        return response()
            ->make('', 200)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD')
            ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, X-Requested-With, X-User-ID, Accept')
            ->header('Access-Control-Max-Age', '86400')
            ->header('Content-Length', '0');
    }

    private function addCorsHeaders(Response $response): Response
    {
        $response->headers->set('Access-Control-Allow-Origin', '*', true);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD', true);
        $response->headers->set('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, X-Requested-With, X-User-ID, Accept', true);
        $response->headers->set('Access-Control-Max-Age', '86400', true);
        
        return $response;
    }
}
