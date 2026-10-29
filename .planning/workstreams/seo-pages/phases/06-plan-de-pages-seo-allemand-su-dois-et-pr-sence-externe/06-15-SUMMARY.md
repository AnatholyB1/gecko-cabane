# 06-15 Summary: Swedish publication (I18N-02)

Done 2026-10-29.

- Owner validated in writing the 8 docs/ph6/review/sv/*.md (message "je valide les documents suédois", conversation Claude Code). No native Swedish reviewer identified; no corrections supplied, none invented.
- 'sv' added to PUBLISHED_PAGES for home, menu and the three guides; REVIEW_LOCALES and EMAIL_LOCALES include 'sv'. /privacy, /getting-here-from-ao-nang and /wine-belgian-beer-krabi stay unpublished in sv.
- Tests updated: the gate requires, for each locale listed in REVIEW/EMAIL locales, a signed review.md/emails.md; sv pages require signed docs and complete keys; an explicit test pins the sv publication scope.
- Gate: npm test 798 passed, tsc clean, lint 0 errors, build green. Local production check on port 3106: sv guide pages indexable with self canonical and reciprocal hreflang (fr/en/de/sv/x-default), sitemap lists the 5 sv URLs, unpublished pages noindex/404.
- Not proven: Supabase-backed pages (/sv, /sv/menu, /sv/fransk-restaurang-krabi) could not render locally with dummy Supabase env (same 500 as /de); their SEO is covered by unit tests only. Swedish language quality is not natively reviewed.
