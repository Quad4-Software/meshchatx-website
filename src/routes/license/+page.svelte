<script>
  import { site } from '$lib/config.js';

  const licensePageUrl = site.url + '/license';
  const licensePageTitle = 'License | MeshChatX';
  const licensePageDesc = 'MeshChatX Licensing Information.';
</script>

<svelte:head>
  <title>{licensePageTitle}</title>
  <meta name="description" content={licensePageDesc} />
  <meta property="og:title" content={licensePageTitle} />
  <meta property="og:description" content={licensePageDesc} />
  <meta property="og:url" content={licensePageUrl} />
  <meta name="twitter:title" content={licensePageTitle} />
  <meta name="twitter:description" content={licensePageDesc} />
</svelte:head>

<section class="px-6 pb-24 md:pb-32">
  <div class="max-w-3xl mx-auto">
    <h1 class="text-4xl md:text-5xl font-black tracking-tight mb-8 text-zinc-900 dark:text-white">License</h1>
    
    <div class="glass-card p-8 md:p-12 space-y-8">
      <div class="space-y-4">
        <p class="text-lg font-bold text-zinc-900 dark:text-white">
          MeshChatX is licensed under MIT
        </p>
        
        <div class="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 font-mono text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">MIT License

Copyright (c) 2024 Liam Cottle
Copyright (c) 2026 Quad4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.</div>
      </div>
    </div>
  </div>
</section>
