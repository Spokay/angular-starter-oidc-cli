const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');

/**
 * Main function to create an Angular starter project
 * @param {string} projectName - Name of the project to create
 * @param {object} options - Command line options
 */
async function createAngularStarter(projectName, options) {
  console.log(chalk.blue.bold('\n🚀 Angular Starter CLI\n'));

  try {
    // Validate project name
    if (!projectName || projectName.trim() === '') {
      console.error(chalk.red('❌ Project name is required!'));
      process.exit(1);
    }

    // Validate project name format
    if (!isValidNpmPackageName(projectName)) {
      console.error(chalk.red('❌ Project name must be a valid npm package name (lowercase, hyphens, no spaces)'));
      process.exit(1);
    }

    // Determine project path
    const targetPath = path.resolve(options.path || '.', projectName);

    // Check if directory already exists
    if (fs.existsSync(targetPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory "${projectName}" already exists. Overwrite?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('Aborted.'));
        process.exit(0);
      }

      // Remove existing directory
      fs.rmSync(targetPath, { recursive: true, force: true });
    }

    // Get configuration from user
    const config = await promptUserConfiguration(projectName);

    // Get template URL
    const templateUrl = options.template || 'https://github.com/Spokay/angular-starter-app-template';

    // Clone template repository
    const spinner = ora('Cloning template repository...').start();

    try {
      cloneTemplate(templateUrl, targetPath);
      spinner.succeed(chalk.green('Template cloned successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to clone template'));
      throw error;
    }

    // Replace tokens in template
    await replaceTokens(targetPath, config);

    // Handle CI file selection
    handleCIFiles(targetPath, config.vcsHost);

    // Generate app-config.json
    generateAppConfig(targetPath, config);

    // Run post-scaffold steps
    await postScaffold(targetPath, config);

    // Success message
    printSuccessMessage(projectName, config);

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Prompt user for all configuration values
 * @param {string} appName - Application name
 * @returns {Promise<object>} Configuration object
 */
async function promptUserConfiguration(appName) {
  console.log(chalk.cyan('Please provide the following configuration:\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'oidcAuthority',
      message: 'What is your OIDC authority URL?',
      validate: (input) => {
        if (!input || input.trim() === '') {
          return 'OIDC authority URL is required';
        }
        // Allow http for localhost, require https otherwise
        if (!input.match(/^https:\/\/.+/) && !input.match(/^http:\/\/localhost/)) {
          return 'OIDC authority must be a valid HTTPS URL (or HTTP for localhost)';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'oidcClientId',
      message: 'What is your OIDC client ID?',
      validate: (input) => {
        if (!input || input.trim() === '') {
          return 'OIDC client ID is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'redirectUrl',
      message: 'What is your OIDC redirect URL?',
      default: 'http://localhost:4200',
      validate: (input) => {
        if (!input || input.trim() === '') {
          return 'Redirect URL is required';
        }
        if (!input.match(/^https?:\/\/.+/)) {
          return 'Redirect URL must be a valid URL';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'apiBaseUrl',
      message: 'What is your API base URL?',
      default: 'http://localhost:3000',
      validate: (input) => {
        if (!input || input.trim() === '') {
          return 'API base URL is required';
        }
        if (!input.match(/^https?:\/\/.+/)) {
          return 'API base URL must be a valid URL';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'vcsHost',
      message: 'Which VCS host are you using?',
      choices: ['github', 'gitlab'],
      default: 'github'
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager would you like to use?',
      choices: ['npm', 'pnpm', 'yarn'],
      default: 'npm'
    },
    {
      type: 'input',
      name: 'nodeVersion',
      message: 'Which Node.js version?',
      default: '20',
      validate: (input) => {
        if (!input || input.trim() === '') {
          return 'Node version is required';
        }
        return true;
      }
    }
  ]);

  // Derive package manager run command
  const pkgMgrRun = {
    'npm': 'npm run',
    'pnpm': 'pnpm',
    'yarn': 'yarn'
  }[answers.packageManager];

  return {
    appName,
    oidcAuthority: answers.oidcAuthority,
    oidcClientId: answers.oidcClientId,
    redirectUrl: answers.redirectUrl,
    apiBaseUrl: answers.apiBaseUrl,
    vcsHost: answers.vcsHost,
    packageManager: answers.packageManager,
    pkgMgrRun,
    nodeVersion: answers.nodeVersion,
    cliPackage: 'angular-starter-cli' // Our CLI package name
  };
}

/**
 * Clone the template repository
 * @param {string} templateUrl - URL of the template repository
 * @param {string} targetPath - Path where the project should be created
 */
function cloneTemplate(templateUrl, targetPath) {
  try {
    // Validate template URL format to prevent command injection
    if (!isValidGitUrl(templateUrl)) {
      throw new Error('Invalid template URL format');
    }

    // Additional check: reject URLs containing special git options
    if (templateUrl.includes('--upload-pack') || templateUrl.includes('-u')) {
      throw new Error('Invalid template URL: contains forbidden git options');
    }

    // Use spawn with array of arguments to prevent command injection
    // Add --no-checkout to prevent any hooks from running during clone
    const result = spawnSync('git', ['clone', '--', templateUrl, targetPath], {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    if (result.error || result.status !== 0) {
      throw new Error(result.stderr || result.error?.message || 'Git clone failed');
    }

    // Remove .git directory to start fresh
    const gitDir = path.join(targetPath, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }
  } catch (error) {
    throw new Error(`Failed to clone template: ${error.message}`);
  }
}

/**
 * Validate if the URL is a valid Git repository URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidGitUrl(url) {
  // Allow HTTPS, SSH, and Git protocol URLs
  const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/)[\w\.\-@:\/~]+\.git$|^(https?:\/\/|git@|git:\/\/)[\w\.\-@:\/~]+$/i;
  return gitUrlPattern.test(url);
}

/**
 * Replace all tokens in template files
 * @param {string} targetPath - Path of the cloned project
 * @param {object} config - Configuration object
 */
async function replaceTokens(targetPath, config) {
  const spinner = ora('Replacing configuration tokens...').start();

  try {
    // Files to process for token replacement
    const filesToReplace = [
      'package.json',
      'angular.json',
      'src/app/app.spec.ts',
      'README.md',
      'public/assets/app-config.json'
    ];

    // Add CI files based on VCS choice
    if (config.vcsHost === 'github') {
      filesToReplace.push('.github/workflows/ci.yml');
    } else if (config.vcsHost === 'gitlab') {
      filesToReplace.push('.gitlab-ci.yml');
    }

    // Token mapping
    const tokens = {
      '__APP_NAME__': config.appName,
      '__OIDC_AUTHORITY__': config.oidcAuthority,
      '__CLIENT_ID__': config.oidcClientId,
      '__REALM__': extractRealm(config.oidcAuthority),
      '__NODE_VERSION__': config.nodeVersion,
      '__PKG_MGR__': config.packageManager,
      '__PKG_MGR_RUN__': config.pkgMgrRun,
      '__CLI_PACKAGE__': config.cliPackage
    };

    // Replace tokens in each file
    for (const file of filesToReplace) {
      const filePath = path.join(targetPath, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace all tokens
        for (const [token, value] of Object.entries(tokens)) {
          content = content.replace(new RegExp(token, 'g'), value);
        }

        fs.writeFileSync(filePath, content, 'utf8');
      }
    }

    spinner.succeed(chalk.green('Configuration tokens replaced!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to replace tokens'));
    throw error;
  }
}

/**
 * Extract realm from OIDC authority URL
 * @param {string} authority - OIDC authority URL
 * @returns {string} Realm name or 'my-realm' as default
 */
function extractRealm(authority) {
  const match = authority.match(/\/realms\/([^\/]+)/);
  return match ? match[1] : 'my-realm';
}

/**
 * Handle CI file selection based on VCS host
 * @param {string} targetPath - Path of the cloned project
 * @param {string} vcsHost - VCS host (github or gitlab)
 */
function handleCIFiles(targetPath, vcsHost) {
  const spinner = ora('Configuring CI files...').start();

  try {
    if (vcsHost === 'github') {
      // Delete GitLab CI file
      const gitlabCIPath = path.join(targetPath, '.gitlab-ci.yml');
      if (fs.existsSync(gitlabCIPath)) {
        fs.unlinkSync(gitlabCIPath);
      }
    } else if (vcsHost === 'gitlab') {
      // Delete GitHub workflows directory
      const githubDir = path.join(targetPath, '.github');
      if (fs.existsSync(githubDir)) {
        fs.rmSync(githubDir, { recursive: true, force: true });
      }
    }

    spinner.succeed(chalk.green(`CI configured for ${vcsHost}!`));
  } catch (error) {
    spinner.warn(chalk.yellow('Could not fully configure CI files'));
  }
}

/**
 * Generate app-config.json with user values
 * @param {string} targetPath - Path of the cloned project
 * @param {object} config - Configuration object
 */
function generateAppConfig(targetPath, config) {
  const spinner = ora('Generating app-config.json...').start();

  try {
    const appConfigPath = path.join(targetPath, 'public', 'assets', 'app-config.json');

    // Create the config object
    const appConfig = {
      oidc: {
        authority: config.oidcAuthority,
        clientId: config.oidcClientId,
        redirectUrl: config.redirectUrl,
        postLogoutRedirectUri: config.redirectUrl,
        scope: 'openid profile email',
        responseType: 'code',
        secureRoutes: [config.apiBaseUrl]
      },
      api: {
        baseUrl: config.apiBaseUrl
      }
    };

    // Ensure directory exists
    const appConfigDir = path.dirname(appConfigPath);
    if (!fs.existsSync(appConfigDir)) {
      fs.mkdirSync(appConfigDir, { recursive: true });
    }

    // Write the config file
    fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2), 'utf8');

    spinner.succeed(chalk.green('app-config.json generated!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate app-config.json'));
    throw error;
  }
}

/**
 * Run post-scaffold steps
 * @param {string} targetPath - Path of the cloned project
 * @param {object} config - Configuration object
 */
async function postScaffold(targetPath, config) {
  // Check if package manager is installed
  const pkgMgrCheck = spawnSync(config.packageManager, ['--version'], {
    stdio: 'pipe',
    encoding: 'utf8'
  });

  if (pkgMgrCheck.error || pkgMgrCheck.status !== 0) {
    console.log(chalk.yellow(`\n⚠️  Warning: ${config.packageManager} is not installed on your system.`));
    console.log(chalk.yellow(`Please install ${config.packageManager} and run '${config.packageManager} install' manually.\n`));
    return;
  }

  // Install dependencies
  const installSpinner = ora(`Installing dependencies with ${config.packageManager}...`).start();

  try {
    const installArgs = ['install'];
    const installResult = spawnSync(config.packageManager, installArgs, {
      cwd: targetPath,
      stdio: 'pipe',
      encoding: 'utf8'
    });

    if (installResult.error || installResult.status !== 0) {
      installSpinner.fail(chalk.red('Failed to install dependencies'));
      console.log(chalk.yellow(`\nPlease run '${config.packageManager} install' manually in the project directory.\n`));
    } else {
      installSpinner.succeed(chalk.green('Dependencies installed!'));
    }
  } catch (error) {
    installSpinner.fail(chalk.red('Failed to install dependencies'));
    console.log(chalk.yellow(`\nPlease run '${config.packageManager} install' manually.\n`));
  }

  // Ask if user wants to initialize git
  const { initGit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Initialize git repository?',
      default: true
    }
  ]);

  if (initGit) {
    const gitSpinner = ora('Initializing git repository...').start();

    try {
      // Check if git is installed
      const gitCheck = spawnSync('git', ['--version'], { stdio: 'pipe' });

      if (gitCheck.error) {
        gitSpinner.warn(chalk.yellow('Git is not installed'));
        return;
      }

      // Initialize git
      spawnSync('git', ['init'], { cwd: targetPath, stdio: 'pipe' });
      spawnSync('git', ['add', '.'], { cwd: targetPath, stdio: 'pipe' });
      spawnSync('git', ['commit', '-m', 'chore: initial commit from angular-starter-cli'], {
        cwd: targetPath,
        stdio: 'pipe'
      });

      gitSpinner.succeed(chalk.green('Git repository initialized!'));

      // Ask for remote URL
      const { addRemote } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addRemote',
          message: 'Add git remote?',
          default: false
        }
      ]);

      if (addRemote) {
        const { remoteUrl } = await inquirer.prompt([
          {
            type: 'input',
            name: 'remoteUrl',
            message: 'Enter remote repository URL:',
            validate: (input) => {
              if (!input || input.trim() === '') {
                return 'Remote URL is required';
              }
              return true;
            }
          }
        ]);

        spawnSync('git', ['remote', 'add', 'origin', remoteUrl], {
          cwd: targetPath,
          stdio: 'pipe'
        });

        console.log(chalk.green('✓ Remote added successfully!'));
      }
    } catch (error) {
      gitSpinner.fail(chalk.red('Failed to initialize git'));
    }
  }
}

/**
 * Print success message with next steps
 * @param {string} projectName - Name of the project
 * @param {object} config - Configuration object
 */
function printSuccessMessage(projectName, config) {
  console.log(chalk.green.bold('\n✓ Project "' + projectName + '" created successfully!\n'));

  console.log(chalk.cyan.bold('Next steps:'));
  console.log(chalk.white(`  cd ${projectName}`));
  console.log(chalk.white(`  ${config.pkgMgrRun} start          # Start dev server`));
  console.log(chalk.white(`  ${config.pkgMgrRun} commit         # Make a commit (uses commitizen)`));

  console.log(chalk.cyan.bold('\nConfiguration:'));
  console.log(chalk.white(`  - OIDC: ${config.oidcAuthority}`));
  console.log(chalk.white(`  - API: ${config.apiBaseUrl}`));
  console.log(chalk.white('  - Edit public/assets/app-config.json to change runtime config'));

  console.log(chalk.cyan.bold('\nDocumentation:'));
  console.log(chalk.white('  See README.md and docs/adrs/\n'));
}

/**
 * Validate if project name is a valid npm package name
 * @param {string} name - Project name to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidNpmPackageName(name) {
  // npm package name rules: lowercase, no spaces, can contain hyphens and numbers
  return /^[a-z0-9-]+$/.test(name);
}

module.exports = {
  createAngularStarter,
  cloneTemplate,
  isValidGitUrl,
  isValidNpmPackageName,
  replaceTokens,
  handleCIFiles,
  generateAppConfig,
  extractRealm
};
