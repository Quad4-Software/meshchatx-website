<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class OfflineController extends Controller
{
    public function __invoke(): View
    {
        return view('pages.offline', [
            'page' => 'offline',
        ]);
    }
}
