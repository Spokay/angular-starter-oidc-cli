# angular-starter-cli

A CLI tool for scaffolding Angular applications with OIDC authentication from the `angular-starter-app-template`.

## Description

This CLI tool scaffolds new Angular applications from the [angular-starter-app-template](https://github.com/Spokay/angular-starter-app-template) repository. It guides you through an interactive setup process to configure:

- OIDC authentication (authority, client ID, redirect URL)
- API integration
- VCS provider (GitHub or GitLab)
- Package manager (npm, pnpm, or yarn)
- Node.js version

The CLI handles all the heavy lifting: cloning the template, replacing configuration tokens, setting up CI files, and initializing your project.

## Installation

### Local Development
```bash
npm install
npm link
```

### Global Installation (when published)
```bash
npm install -g angular-starter-cli
```

## Usage

### Create a new Angular project

```bash
angular-starter create <project-name>
```

The CLI will interactively prompt you for:
1. OIDC authority URL
2. OIDC client ID
3. OIDC redirect URL (default: `http://localhost:4200`)
4. API base URL (default: `http://localhost:3000`)
5. VCS host (github or gitlab)
6. Package manager (npm, pnpm, or yarn)
7. Node.js version (default: 20)

### With options

```bash
# Use custom template URL
angular-starter create my-app --template https://github.com/Spokay/angular-starter-app-template

# Create in specific directory
angular-starter create my-app --path ./projects
```

### Options

- `-t, --template <url>`: Template repository URL (default: angular-starter-app-template)
- `-p, --path <path>`: Path where project should be created (default: current directory)
- `-V, --version`: Output the version number
- `-h, --help`: Display help information

## Features

- 🚀 Quick project scaffolding with OIDC authentication pre-configured
- 🔐 Interactive OIDC configuration setup
- 📦 Automatic dependency installation (npm/pnpm/yarn)
- 🔧 CI/CD configuration (GitHub Actions or GitLab CI)
- 💬 Input validation for all configuration values
- 🎯 Token replacement for all placeholders
- 🌳 Optional git initialization with remote setup
- ✨ Clean and user-friendly CLI interface
- 🎨 Colored output for better readability

## How It Works

1. **Validates** project name (must be valid npm package name)
2. **Prompts** for all configuration values with validation
3. **Clones** the angular-starter-app-template repository
4. **Replaces** all `__TOKEN__` placeholders with your values
5. **Configures** CI files (GitHub Actions or GitLab CI)
6. **Generates** `app-config.json` with your OIDC settings
7. **Installs** dependencies with your chosen package manager
8. **Initializes** git repository (optional)
9. **Provides** next steps to get started

## Example

```bash
$ angular-starter create my-awesome-app
🚀 Angular Starter CLI

Please provide the following configuration:

? What is your OIDC authority URL? https://idp.example.com/realms/my-realm
? What is your OIDC client ID? my-spa-client
? What is your OIDC redirect URL? http://localhost:4200
? What is your API base URL? http://localhost:3000
? Which VCS host are you using? github
? Which package manager would you like to use? npm
? Which Node.js version? 20

✔ Template cloned successfully!
✔ Configuration tokens replaced!
✔ CI configured for github!
✔ app-config.json generated!
✔ Dependencies installed!
✔ Git repository initialized!

✓ Project "my-awesome-app" created successfully!

Next steps:
  cd my-awesome-app
  npm run start          # Start dev server
  npm run commit         # Make a commit (uses commitizen)

Configuration:
  - OIDC: https://idp.example.com/realms/my-realm
  - API: http://localhost:3000
  - Edit public/assets/app-config.json to change runtime config

Documentation:
  See README.md and docs/adrs/
```

## Input Validation

The CLI validates all inputs:
- **Project name**: Must be valid npm package name (lowercase, hyphens, no spaces)
- **OIDC Authority**: Must be valid HTTPS URL (or HTTP for localhost)
- **Redirect URL**: Must be valid URL format
- **API Base URL**: Must be valid URL format
- **Package Manager**: Must be installed on your system

## Development

```bash
# Install dependencies
npm install

# Test locally
npm link
angular-starter create test-project
```

## License

ISC
