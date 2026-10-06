# Dependabot follow-up (2026-10-07 JST)

## What was verified before this follow-up

The default branch was still commit `4a140e0d09f74d4384f225b04ea9efe17ad6ced8`.
That commit removes the vendored jQuery 1.7.2/1.8.2 files, updates 13 CDN imports
to HTTPS jQuery 3.7.1 with SRI, and removes the treasure game's jQuery dependency.
The independently recorded browser and Pages verification is:
https://github.com/beachone1155/webapp/actions/runs/37463741154

Despite that source fix, REST and GraphQL both still reported eight OPEN alerts:
#3, #4, #5, #6, #11, #12, #13 and #14. All refer to these deleted files:

- `smartphonegame/ch5/1-appcahce/jquery-1.7.2.min.js`
- `smartphonegame/ch5/1-appcahce/jquery-1.8.2.min.js`

The dependency graph reported zero manifests, and the exported SBOM contained
only the repository itself. In particular, the current CDN dependency was not
represented. These are observations; they do not establish GitHub's internal
reason for not automatically closing the historical alerts.

## This change

`package.json` now declares the exact jQuery version used by the browser samples.
It is dependency inventory, not a change to how the static site is served. No
npm install, bundler, node_modules upload or runtime change is required.

The new regression tests require every CDN reference to match that declaration.
The existing tests continue to enforce the reviewed release, exact SRI value,
absence of legacy jQuery, syntax validity and treasure-game behavior. All tests
run on pushes and pull requests through a read-only GitHub Actions workflow.
A dependency-only version bump cannot silently mark an unchanged CDN as updated:
the manifest, actual HTML imports, SRI and approved test values must agree.

A supported manifest gives GitHub a current dependency to analyze instead of
relying on recognition of loose legacy JavaScript files. This is not a guarantee
that historical alerts will be automatically closed. Alert-state verification
and any evidence-backed disposition are recorded separately in the PR and alert
timelines. No alert-dismissal rule, ignore rule, notification suppression,
security-feature disablement, archive operation or history rewrite is included.

## Future updates

Run `npm test` (or `node --test tests/*.test.cjs`) without installing dependencies.
When updating jQuery, update the actual CDN references and SRI, the inventory and
the approved release in the tests together; then repeat representative browser
checks. Historical JSONP providers and old AppCache browser support are outside
these regression tests.

GitHub documentation:
- https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/vulnerability-detection
- https://docs.github.com/en/code-security/how-tos/manage-security-alerts/manage-dependabot-alerts/view-dependabot-alerts
