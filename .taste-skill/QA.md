ROUND 1
Seen in one second: A medicine package confirmation form.
Idea (one sentence): The package identity becomes the organizing structure for a referenced medicine summary.
Live thing: Form submission, sample preview, source disclosures and reset.
Layout words by section: introduction=split / form=two-column / results=paired sections / process=sequence.
Scores: design 7 · usability 7 · creativity 6 · content 7 → overall 6.8.
Caps applied: app-screen rules, not marketing imagery rules; creativity limited by conventional form design.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Desktop left frame has unused space (desktop-fold.jpg); acceptable for the chosen framed-sheet shell, but a future iteration can compress it.
2. Sample action wraps at tablet width (tablet-fold.jpg); readable, but could benefit from a wider action column.
3. Mobile requires scrolling to submit (mobile-page-01.jpg); fields remain readable rather than compressed.

Verification: final build inspected at 1440, 768 and 390 pixels, zero FAIL and zero WARN. All six default-view screenshots were inspected. Desktop and phone sample screenshots were also inspected. Browser smoke passed sample rendering, reset focus, unavailable API message, mocked clarification, mobile overflow and JS error checks.
Backend: 12 tests pass with mocked source/AI responses, including completed/refused/incomplete output, evidence rejection, matching and atomic quotas. No live API call or deployed Worker test completed. The attempted FDA network smoke check was declined after sandbox DNS failed.
