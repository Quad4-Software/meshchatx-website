<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class GitController extends Controller
{
    public function __invoke(): View
    {
        return view('pages.git');
    }
}
