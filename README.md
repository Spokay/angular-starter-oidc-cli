# angular-starter-cli

A CLI tool for creating Angular starter applications from templates with customizable arguments.

## Description

This CLI tool allows you to quickly scaffold Angular applications using a template repository. Simply provide a project name and template URL, and the CLI will clone and customize the template for you.

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

### With options

```bash
angular-starter create my-app --template https://github.com/angular/quickstart
angular-starter create my-app --template <template-url> --path ./projects
```

### Options

- `-t, --template <url>`: Template repository URL (will prompt if not provided)
- `-p, --path <path>`: Path where project should be created (default: current directory)
- `-V, --version`: Output the version number
- `-h, --help`: Display help information

## Features

- 🚀 Quick project scaffolding from any Git template
- 📦 Automatic project customization
- 💬 Interactive prompts for missing information
- ✨ Clean and user-friendly CLI interface
- 🎨 Colored output for better readability

## How It Works

1. Clones the specified template repository
2. Removes Git history for a fresh start
3. Updates `package.json` with your project name
4. Provides next steps to get started

## Example

```bash
$ angular-starter create my-awesome-app
🚀 Angular Starter CLI

? Enter the template repository URL: https://github.com/angular/quickstart
✔ Template cloned successfully!
✔ Project customized!

✅ Project created successfully!

Next steps:
  cd my-awesome-app
  npm install
  npm start
```

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
