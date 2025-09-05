# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `pr-lint-action` - a GitHub Action that verifies pull requests contain ticket references. It's a Docker-based action that checks PR titles, branch names, and commits for project ticket patterns like `[PROJ-1234]` or `PROJ-1234`.

## Key Architecture

- **Main entry**: `index.js` - uses `actions-toolkit` to handle GitHub Action lifecycle
- **Configuration**: `utils/config.js` - loads YAML config from `.github/pr-lint.yml`
- **Core logic**: Pattern matching using regex to find ticket references in various formats
- **Docker**: Runs as containerized GitHub Action defined in `action.yml`

## Development Commands

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Run linting
yarn lint

# Fix lint issues automatically
yarn lint --fix

# Start locally (for debugging)
yarn start
```

## Configuration Structure

The action reads from `.github/pr-lint.yml` with these options:
- `projects`: Array of project prefixes (e.g., `['PROJ', 'ABC']`)
- `check_title`: Boolean - check PR title
- `check_branch`: Boolean - check branch name
- `check_commits`: Boolean - check all commit messages
- `ignore_case`: Boolean - case insensitive matching
- `require_brackets`: Boolean - require `[PROJ-123]` format vs just `PROJ-123`

## Testing

Tests use Jest and cover all validation scenarios. Test fixtures are in the `fixtures/` directory. The test suite verifies behavior across different configuration combinations and edge cases.

## Code Patterns

- Uses `actions-toolkit` for GitHub API interactions
- Regex patterns are dynamically generated based on project names
- Default configuration is merged with user-provided config
- Error handling includes proper GitHub Action failure reporting