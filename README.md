# pr-lint-action

A GitHub Action that verifies your pull request contains a reference to a ticket.  You can use this to (optionally) check:

* The PR title contains `[PROJ-1234]`
* The branch name contains `PROJ-1234` or `PROJ_1234`
* The PR description contains `[PROJ-1234]`
* Each commit contains `[PROJ-1234]`



## Usage

Add `.github/workflows/main.yml` with the following:

```
name: PR Lint
on: [pull_request]
jobs:
  pr_lint:
    runs-on: ubuntu-latest
    steps:
    - uses: vijaykramesh/pr-lint-action@v2.3
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```

See [pr-lint-action-example-repo](https://github.com/vijaykramesh/pr-lint-action-example-repo) for an example of usage.


## Configuration

Configure by creating a `.github/pr-lint.yml` file:

For example:

```yml
projects: ['PROJ', 'ABC']
check_title: true
check_branch: true
check_commits: true
check_description: true
ignore_case: true
require_brackets: true
check_logic: 'and'  # 'and' (default) or 'or'
```

### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `projects` | `['PROJ']` | Array of allowed project codes (e.g., JIRA project keys) |
| `check_title` | `true` | Whether to check PR title for ticket reference |
| `check_branch` | `false` | Whether to check branch name for ticket reference |
| `check_commits` | `false` | Whether to check all commit messages for ticket reference |
| `check_description` | `false` | Whether to check PR description for ticket reference |
| `ignore_case` | `false` | Whether to ignore case when matching project codes |
| `require_brackets` | `true` | Whether to require brackets around ticket reference (e.g., `[PROJ-123]` vs `PROJ-123`) |
| `check_logic` | `'and'` | Logic mode: `'and'` (all enabled checks must pass) or `'or'` (at least one enabled check must pass) |

### Logic Modes

**AND Logic (default)**: All enabled checks must pass for the action to succeed.
```yml
projects: ['PROJ']
check_title: true
check_branch: true
check_logic: 'and'  # Both title AND branch must contain ticket reference
```

**OR Logic**: At least one enabled check must pass for the action to succeed.
```yml
projects: ['PROJ']
check_title: true
check_branch: true
check_description: true
check_logic: 'or'  # Either title OR branch OR description must contain ticket reference
```

## Local Development

Run `yarn install` to install any dependencies needed.

## Testing

Run `yarn test` to test:

```
 PASS  ./index.test.js
  pr-lint-action
    ✓ fails if check_title is true and title does not match (15 ms)
    ✓ fails if bad title and branch (14 ms)
    ✓ passes if check_title is false and title does not match (6 ms)
    ✓ passes if check_title is true and title matches (5 ms)
    ✓ fails if check_branch is true and branch does not match (5 ms)
    ✓ passes if check_branch is false and branch does not match (5 ms)
    ✓ passes if check_branch is true and branch matches (5 ms)
    ✓ passes if check_commits is true and all commits match (7 ms)
    ✓ fails if check_commits is true and some commits do not match (9 ms)
    ✓ passes if check_commits is false and all commits match (4 ms)
    ✓ passes if check_commits is false and some commits do not match (5 ms)
    ✓ fails if check_branch and check_title is true and title does not match (7 ms)
    ✓ fails if check_branch and check_title is true and title does not match (8 ms)
    ✓ passes if check_branch and check_title is true and both match (10 ms)
    ✓ passes if ignore_case and lower case title/branch (6 ms)
    ✓ passes if ignore_case and lower case commits (7 ms)
    ✓ fails if not ignore_case and lower case title/branch (4 ms)
    ✓ passes if require_brakcets is false and title matches without brackets (5 ms)
    ✓ fails if require_brackets is true or default and title matches without brackets (4 ms)
```

## Lint

Run `yarn lint` to run ESLint.  Run `yarn lint --fix` to fix any issues that it can.

## Contributing

If you have other things worth automatically checking for in your PRs, please submit a pull request.
