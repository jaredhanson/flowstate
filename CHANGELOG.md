# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Added third `preventReturnTo` argument to `res.redirect` (or second, when
  optional `status` is not supplied) that prevents adding the `return_to` query
  parameter to the URL.  Useful when the URL includes that a different parameter
  set to that value.

### Changed
- Renamed `resumeState` property of state objects to `state`.

## [0.5.1] - 2021-12-13
### Added

- Added `req.popState()`.

[Unreleased]: https://github.com/jaredhanson/flowstate/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/jaredhanson/flowstate/compare/v0.5.0...v0.5.1
