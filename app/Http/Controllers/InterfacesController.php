<?php

namespace App\Http\Controllers;

use App\Services\RnsDirectoryService;
use Illuminate\View\View;

class InterfacesController extends Controller
{
    public function __invoke(RnsDirectoryService $directory): View
    {
        return view('pages.interfaces', [
            'directory' => $directory->payload(),
        ]);
    }
}
