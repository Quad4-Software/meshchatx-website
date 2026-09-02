<?php

namespace App\Http\Controllers;

use App\Services\DocsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DocsController extends Controller
{
    public function __construct(private readonly DocsService $docs) {}

    public function index(): RedirectResponse
    {
        return redirect()->to(locale_route('docs.show', [
            'slug' => $this->docs->defaultSlug(),
        ]));
    }

    public function show(Request $request): View
    {
        $slug = (string) $request->route('slug', '');

        if (! $this->isValidSlug($slug) || ! $this->docs->exists($slug)) {
            throw new NotFoundHttpException;
        }

        $page = $this->docs->page($slug);

        return view('pages.docs.show', [
            'page' => 'docs',
            'doc' => $page,
            'docsNav' => $this->docs->navigation($slug),
            'searchIndex' => $this->docs->searchIndex(),
        ]);
    }

    public function export(Request $request): Response
    {
        $slug = (string) $request->route('slug', '');
        $format = strtolower((string) $request->route('format', ''));

        if (! $this->isValidSlug($slug) || ! $this->docs->exists($slug)) {
            throw new NotFoundHttpException;
        }

        if (! in_array($format, ['md', 'txt'], true)) {
            throw new NotFoundHttpException;
        }

        $filename = $slug.'.'.$format;
        $body = $format === 'md'
            ? $this->docs->rawMarkdown($slug)
            : $this->docs->plainText($slug);
        $contentType = $format === 'md'
            ? 'text/markdown; charset=UTF-8'
            : 'text/plain; charset=UTF-8';

        return response($body, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function exportAll(Request $request): Response
    {
        $format = strtolower((string) $request->route('format', ''));

        if (! in_array($format, ['md', 'txt', 'pdf', 'epub'], true)) {
            throw new NotFoundHttpException;
        }

        $filename = 'meshchatx-docs.'.$format;
        [$body, $contentType] = match ($format) {
            'md' => [$this->docs->exportAllMarkdown(), 'text/markdown; charset=UTF-8'],
            'txt' => [$this->docs->exportAllPlainText(), 'text/plain; charset=UTF-8'],
            'pdf' => [$this->docs->exportAllPdf(), 'application/pdf'],
            'epub' => [$this->docs->exportAllEpub(), 'application/epub+zip'],
        };

        return response($body, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    private function isValidSlug(string $slug): bool
    {
        return $slug !== '' && preg_match('/\A[a-z0-9\-]+\z/', $slug) === 1;
    }
}
