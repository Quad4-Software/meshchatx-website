<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class PrivacyController extends Controller
{
    public function __invoke(): View
    {
        return view('pages.privacy');
    }
}
