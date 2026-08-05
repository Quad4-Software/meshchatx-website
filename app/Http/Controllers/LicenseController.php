<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class LicenseController extends Controller
{
    public function __invoke(): View
    {
        return view('pages.license');
    }
}
