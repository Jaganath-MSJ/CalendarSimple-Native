# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✓         |
| < 1.0   | ✗         |

## Reporting a vulnerability

Please do not open a public issue. Report it privately through
[GitHub's private vulnerability reporting](https://github.com/Jaganath-MSJ/CalendarSimple-Native/security/advisories/new).

Include the version, the platform (iOS, Android or web) and steps or code to
reproduce it. You can expect a first reply within 7 days. Once a fix is
released, the advisory is published with credit to the reporter unless you
ask otherwise.

`calendar-simple-native` has no native modules and no network access; its
only runtime dependency is `luxon`. Releases are published from GitHub Actions
with npm trusted publishing and provenance.
