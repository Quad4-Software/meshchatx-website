// Command build assembles static HTML for the MeshChatX marketing site with i18n.
// Usage: go run build.go   (from this directory)
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

const siteOrigin = "https://meshchatx.com"

var (
	reT    = regexp.MustCompile(`\{\{T:([^}]+)\}\}`)
	reBase = regexp.MustCompile(`\{\{BASE\}\}`)
)

func main() {
	dir, err := os.Getwd()
	if err != nil {
		fatalf("%v", err)
	}

	i18nDir := filepath.Join(dir, "i18n")
	en, err := loadLocale(i18nDir, "en")
	if err != nil {
		fatalf("load en: %v", err)
	}

	locales := []string{"en", "de", "ru", "it"}
	trans := map[string]map[string]string{"en": en}
	for _, code := range locales {
		if code == "en" {
			continue
		}
		m, err := loadLocale(i18nDir, code)
		if err != nil {
			fatalf("load %s: %v", code, err)
		}
		trans[code] = mergeFallback(m, en)
	}

	sprite, err := os.ReadFile(filepath.Join(dir, "icons-sprite.html"))
	if err != nil {
		fatalf("icons-sprite: %v", err)
	}
	spriteStr := strings.TrimSpace(string(sprite))

	shellTop, err := os.ReadFile(filepath.Join(dir, "partials", "shell-top.html"))
	if err != nil {
		fatalf("shell-top: %v", err)
	}
	shellBottom, err := os.ReadFile(filepath.Join(dir, "partials", "shell-bottom.html"))
	if err != nil {
		fatalf("shell-bottom: %v", err)
	}

	pages := []struct {
		outFile  string
		mainFile string
		pageID   string
	}{
		{"index.html", "pages/index-main.html", "home"},
		{"download.html", "pages/download-main.html", "download"},
		{"contact.html", "pages/contact-main.html", "contact"},
		{"donate.html", "pages/donate-main.html", "donate"},
		{"license.html", "pages/license-main.html", "license"},
	}

	for _, loc := range locales {
		tr := trans[loc]
		base := ""
		outRoot := dir
		if loc != "en" {
			base = "../"
			outRoot = filepath.Join(dir, loc)
			if err := os.MkdirAll(outRoot, 0o755); err != nil {
				fatalf("mkdir %s: %v", outRoot, err)
			}
		}

		for _, p := range pages {
			top := applyShell(string(shellTop), tr, base, loc, p.pageID)
			bot := applyShell(string(shellBottom), tr, base, loc, p.pageID)
			mainPath := filepath.Join(dir, p.mainFile)
			mainRaw, err := os.ReadFile(mainPath)
			if err != nil {
				fatalf("%s: %v", p.mainFile, err)
			}
			main := applyPage(string(mainRaw), tr, base)

			title := tr["meta.title."+p.pageID]
			desc := tr["meta.desc."+p.pageID]
			canonical := canonicalURL(loc, p.pageID)
			i18nScript := buildI18nScript(tr)

			siteName := tr["brand.name"]
			if siteName == "" {
				siteName = "MeshChatX"
			}
			ogAlt := tr["meta.og_image_alt"]
			if ogAlt == "" {
				ogAlt = siteName + " logo"
			}
			head := buildHead(buildHeadOpts{
				Lang:        loc,
				Title:       title,
				Description: desc,
				Canonical:   canonical,
				Page:        p.pageID,
				Base:        base,
				Sprite:      spriteStr,
				I18nScript:  i18nScript,
				AllLocales:  locales,
				PageID:      p.pageID,
				SkipText:    tr["a11y.skip"],
				SiteName:    siteName,
				OGImageURL:  siteOrigin + "/static/logo.png",
				OGImageAlt:  ogAlt,
			})

			foot := buildFoot(base)
			body := top + main + bot
			out := filepath.Join(outRoot, p.outFile)
			if err := os.WriteFile(out, []byte(head+body+foot), 0o644); err != nil {
				fatalf("write %s: %v", out, err)
			}
			rel := filepath.Join(loc, p.outFile)
			if loc == "en" {
				rel = p.outFile
			}
			fmt.Println("wrote", rel)
		}
	}
}

type buildHeadOpts struct {
	Lang        string
	Title       string
	Description string
	Canonical   string
	Page        string
	Base        string
	Sprite      string
	I18nScript  string
	AllLocales  []string
	PageID      string
	SkipText    string
	SiteName    string
	OGImageURL  string
	OGImageAlt  string
}

func buildHead(o buildHeadOpts) string {
	var b strings.Builder
	b.WriteString("<!DOCTYPE html>\n<html lang=\"")
	b.WriteString(htmlEsc(o.Lang))
	b.WriteString("\">\n<head>\n<meta charset=\"utf-8\" />\n")
	b.WriteString("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n")
	b.WriteString("<meta name=\"theme-color\" content=\"#18181b\" />\n")
	b.WriteString("<meta name=\"color-scheme\" content=\"light dark\" />\n")
	b.WriteString("<link rel=\"icon\" href=\"")
	b.WriteString(o.Base)
	b.WriteString("static/favicon.png\" type=\"image/png\" />\n")
	b.WriteString("<title>")
	b.WriteString(htmlEsc(o.Title))
	b.WriteString("</title>\n<meta name=\"description\" content=\"")
	b.WriteString(htmlEsc(o.Description))
	b.WriteString("\" />\n")
	b.WriteString("<link rel=\"canonical\" href=\"")
	b.WriteString(htmlEsc(o.Canonical))
	b.WriteString("\" />\n")

	for _, loc := range o.AllLocales {
		href := canonicalURL(loc, o.PageID)
		b.WriteString("<link rel=\"alternate\" hreflang=\"")
		b.WriteString(loc)
		b.WriteString("\" href=\"")
		b.WriteString(htmlEsc(href))
		b.WriteString("\" />\n")
	}
	b.WriteString("<link rel=\"alternate\" hreflang=\"x-default\" href=\"")
	b.WriteString(htmlEsc(canonicalURL("en", o.PageID)))
	b.WriteString("\" />\n")

	b.WriteString("<meta name=\"robots\" content=\"index, follow\" />\n")

	b.WriteString("<meta property=\"og:type\" content=\"website\" />\n")
	b.WriteString("<meta property=\"og:site_name\" content=\"")
	b.WriteString(htmlEsc(o.SiteName))
	b.WriteString("\" />\n")
	b.WriteString("<meta property=\"og:title\" content=\"")
	b.WriteString(htmlEsc(o.Title))
	b.WriteString("\" />\n")
	b.WriteString("<meta property=\"og:description\" content=\"")
	b.WriteString(htmlEsc(o.Description))
	b.WriteString("\" />\n")
	b.WriteString("<meta property=\"og:url\" content=\"")
	b.WriteString(htmlEsc(o.Canonical))
	b.WriteString("\" />\n")
	b.WriteString("<meta property=\"og:image\" content=\"")
	b.WriteString(htmlEsc(o.OGImageURL))
	b.WriteString("\" />\n")
	b.WriteString("<meta property=\"og:image:alt\" content=\"")
	b.WriteString(htmlEsc(o.OGImageAlt))
	b.WriteString("\" />\n")
	b.WriteString("<meta property=\"og:locale\" content=\"")
	b.WriteString(htmlEsc(ogLocale(o.Lang)))
	b.WriteString("\" />\n")
	for _, alt := range o.AllLocales {
		if alt == o.Lang {
			continue
		}
		b.WriteString("<meta property=\"og:locale:alternate\" content=\"")
		b.WriteString(htmlEsc(ogLocale(alt)))
		b.WriteString("\" />\n")
	}

	b.WriteString("<meta name=\"twitter:card\" content=\"summary_large_image\" />\n")
	b.WriteString("<meta name=\"twitter:title\" content=\"")
	b.WriteString(htmlEsc(o.Title))
	b.WriteString("\" />\n")
	b.WriteString("<meta name=\"twitter:description\" content=\"")
	b.WriteString(htmlEsc(o.Description))
	b.WriteString("\" />\n")
	b.WriteString("<meta name=\"twitter:image\" content=\"")
	b.WriteString(htmlEsc(o.OGImageURL))
	b.WriteString("\" />\n")
	b.WriteString("<meta name=\"twitter:image:alt\" content=\"")
	b.WriteString(htmlEsc(o.OGImageAlt))
	b.WriteString("\" />\n")

	b.WriteString("<script>\n(function(){var c=document.documentElement.classList,t=localStorage.getItem('theme');if(t==='light'){c.add('light')}else if(t==='dark'||window.matchMedia('(prefers-color-scheme:dark)').matches){c.add('dark')}else{c.add('light')}})();\n</script>\n")
	b.WriteString(o.I18nScript)
	b.WriteString("<link rel=\"stylesheet\" href=\"")
	b.WriteString(o.Base)
	b.WriteString("css/main.css\" />\n</head>\n<body data-page=\"")
	b.WriteString(htmlEsc(o.Page))
	b.WriteString("\" data-locale=\"")
	b.WriteString(htmlEsc(o.Lang))
	b.WriteString("\">\n")

	skipText := o.SkipText
	if skipText == "" {
		skipText = "Skip to content"
	}
	b.WriteString("<a class=\"mcx-skip\" href=\"#main\">")
	b.WriteString(htmlEsc(skipText))
	b.WriteString("</a>\n")

	b.WriteString("<div hidden aria-hidden=\"true\">")
	b.WriteString(o.Sprite)
	b.WriteString("</div>\n")

	return b.String()
}

func ogLocale(loc string) string {
	switch loc {
	case "en":
		return "en_US"
	case "de":
		return "de_DE"
	case "ru":
		return "ru_RU"
	case "it":
		return "it_IT"
	default:
		return "en_US"
	}
}

func htmlEsc(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&quot;")
	return s
}

func buildFoot(base string) string {
	return fmt.Sprintf(`
<script src="%sjs/releases.js"></script>
<script src="%sjs/app.js"></script>
</body>
</html>
`, base, base)
}

func buildI18nScript(tr map[string]string) string {
	js := make(map[string]string)
	for k, v := range tr {
		if strings.HasPrefix(k, "js.") {
			js[strings.TrimPrefix(k, "js.")] = v
		}
	}
	b, err := json.Marshal(js)
	if err != nil {
		return "<script>window.MCX_I18N={}</script>\n"
	}
	return fmt.Sprintf("<script>window.MCX_I18N=%s</script>\n", string(b))
}

func canonicalURL(locale, pageID string) string {
	path := pageSlug(pageID)
	if locale == "en" {
		if path == "" {
			return siteOrigin + "/"
		}
		return siteOrigin + "/" + path
	}
	if path == "" {
		return siteOrigin + "/" + locale + "/"
	}
	return siteOrigin + "/" + locale + "/" + path
}

func pageSlug(pageID string) string {
	switch pageID {
	case "home":
		return ""
	case "download":
		return "download"
	case "contact":
		return "contact"
	case "donate":
		return "donate"
	case "license":
		return "license"
	default:
		return ""
	}
}

func loadLocale(dir, code string) (map[string]string, error) {
	out := make(map[string]string)
	mainPath := filepath.Join(dir, code+".json")
	raw, err := os.ReadFile(mainPath)
	if err != nil {
		return nil, err
	}
	if err := mergeLocaleJSON(raw, out); err != nil {
		return nil, err
	}
	extraPath := filepath.Join(dir, code+".download.json")
	raw2, err := os.ReadFile(extraPath)
	if err == nil {
		if err := mergeLocaleJSON(raw2, out); err != nil {
			return nil, err
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	return out, nil
}

func mergeLocaleJSON(raw []byte, out map[string]string) error {
	var root any
	if err := json.Unmarshal(raw, &root); err != nil {
		return err
	}
	flatten("", root, out)
	return nil
}

func flatten(prefix string, v any, out map[string]string) {
	switch t := v.(type) {
	case map[string]any:
		for k, v2 := range t {
			nk := k
			if prefix != "" {
				nk = prefix + "." + k
			}
			flatten(nk, v2, out)
		}
	case string:
		if prefix != "" {
			out[prefix] = t
		}
	default:
	}
}

func mergeFallback(loc, en map[string]string) map[string]string {
	out := make(map[string]string)
	for k, v := range en {
		out[k] = v
	}
	for k, v := range loc {
		if v != "" {
			out[k] = v
		}
	}
	return out
}

func applyT(s string, tr map[string]string) string {
	return reT.ReplaceAllStringFunc(s, func(m string) string {
		sub := reT.FindStringSubmatch(m)
		if len(sub) < 2 {
			return m
		}
		key := sub[1]
		if v, ok := tr[key]; ok {
			return v
		}
		return "MISSING:" + key
	})
}

func applyBase(s, base string) string {
	return reBase.ReplaceAllString(s, base)
}

func applyShell(s string, tr map[string]string, base string, currentLocale, pageID string) string {
	s = applyBase(s, base)
	s = applyT(s, tr)
	s = replaceLangHrefs(s, currentLocale, pageID)
	s = replaceLangActive(s, currentLocale)
	return s
}

func replaceLangActive(s, currentLocale string) string {
	for _, loc := range []string{"en", "de", "ru", "it"} {
		ph := "{{LANG_ACTIVE_" + strings.ToUpper(loc) + "}}"
		v := ""
		if currentLocale == loc {
			v = ` aria-current="page"`
		}
		s = strings.ReplaceAll(s, ph, v)
	}
	return s
}

func applyPage(s string, tr map[string]string, base string) string {
	s = applyBase(s, base)
	s = applyT(s, tr)
	return s
}

func replaceLangHrefs(s, currentLocale, pageID string) string {
	for _, loc := range []string{"en", "de", "ru", "it"} {
		ph := "{{LANG_HREF_" + strings.ToUpper(loc) + "}}"
		s = strings.ReplaceAll(s, ph, crossLangHref(currentLocale, loc, pageID))
	}
	return s
}

func crossLangHref(fromLocale, toLocale, pageID string) string {
	f := pageFile(pageID)
	if fromLocale == toLocale {
		return f
	}
	if toLocale == "en" {
		if fromLocale == "en" {
			return f
		}
		return "../" + f
	}
	if fromLocale == "en" {
		return toLocale + "/" + f
	}
	return "../" + toLocale + "/" + f
}

func pageFile(pageID string) string {
	switch pageID {
	case "home":
		return "index.html"
	case "download":
		return "download.html"
	case "contact":
		return "contact.html"
	case "donate":
		return "donate.html"
	case "license":
		return "license.html"
	default:
		return "index.html"
	}
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
