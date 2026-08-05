<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class BrandingController extends Controller
{
    public function __invoke(): View
    {
        return view('pages.branding', [
            'branding' => config('meshchatx.branding'),
        ]);
    }
}
