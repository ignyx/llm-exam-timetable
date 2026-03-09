# llm-exam-timetable

Plan exam timetables using LLM-assisted constraint programming

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

This will serve the app on `http://localhost:3000`

## Running E2E Tests

This project uses [Playwright][playwright] for end-to-end testing.

[playwright]: https://playwright.dev/

### Installed testing browsers

```bash
npx playwright install
```

### Run all tests

```bash
npm test
```

### Run tests with UI

```bash
npm run test:ui
```

### View test report

```bash
npm run test:report
```

## Project Structure

```
/
├── index.html          # Main HTML entry point
├── src/
│   └── app.js          # Main application logic
├── css/
│   └── styles.css      # CSS styles
├── e2e/
│   └── test.spec.js    # Playwright tests
├── playwright.config.js # Playwright configuration
└── package.json
```

## Versioning and Commit Style

### Semantic Versioning

We use [Semantic Versioning][semver] for version numbers:

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

[semver]: https://semver.org/

### Conventional Commits

We follow the [Conventional Commits][convetional-commits] specification for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Common types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Build process or auxiliary tool changes

**Examples:**

```bash
git commit -m "feat: add exam scheduling algorithm"
git commit -m "fix: correct timetable conflict detection"
git commit -m "docs: update README with testing instructions"
git commit -m "refactor: improve exam data structure"
```

[convetional-commits]: https://www.conventionalcommits.org/en/v1.0.0/
