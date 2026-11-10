<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success'       => fn () => $request->session()->get('success'),
                'message'       => fn () => $request->session()->get('message'),
                'error'         => fn () => $request->session()->get('error'),
                'batch'         => fn () => $request->session()->get('batch'),
                'created_count' => fn () => $request->session()->get('created_count'),
                'updated_count' => fn () => $request->session()->get('updated_count'),
                'total_count'   => fn () => $request->session()->get('total_count'),
                'status'        => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
