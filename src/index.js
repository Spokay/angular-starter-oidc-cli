const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

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

    // Get template URL if not provided
    let templateUrl = options.template;
    if (!templateUrl) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'templateUrl',
          message: 'Enter the template repository URL:',
          default: 'https://github.com/angular/quickstart',
          validate: (input) => {
            if (!input || input.trim() === '') {
              return 'Template URL is required!';
            }
            return true;
          }
        }
      ]);
      templateUrl = answers.templateUrl;
    }

    // Determine project path
    const targetPath = path.resolve(options.path, projectName);

    // Check if directory already exists
    if (fs.existsSync(targetPath)) {
      console.error(chalk.red(`❌ Directory "${projectName}" already exists!`));
      process.exit(1);
    }

    // Clone template repository
    const spinner = ora('Cloning template repository...').start();
    
    try {
      cloneTemplate(templateUrl, targetPath);
      spinner.succeed(chalk.green('Template cloned successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to clone template'));
      throw error;
    }

    // Customize project
    customizeProject(projectName, targetPath);

    // Success message
    console.log(chalk.green.bold('\n✅ Project created successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white(`  cd ${projectName}`));
    console.log(chalk.white('  npm install'));
    console.log(chalk.white('  npm start\n'));

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Clone the template repository
 * @param {string} templateUrl - URL of the template repository
 * @param {string} targetPath - Path where the project should be created
 */
function cloneTemplate(templateUrl, targetPath) {
  try {
    execSync(`git clone ${templateUrl} "${targetPath}"`, {
      stdio: 'pipe'
    });

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
 * Customize the cloned project
 * @param {string} projectName - Name of the project
 * @param {string} targetPath - Path of the cloned project
 */
function customizeProject(projectName, targetPath) {
  const spinner = ora('Customizing project...').start();

  try {
    // Update package.json with new project name
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.name = projectName;
      packageJson.version = '0.0.1';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    spinner.succeed(chalk.green('Project customized!'));
  } catch (error) {
    spinner.warn(chalk.yellow('Could not fully customize project'));
  }
}

module.exports = {
  createAngularStarter,
  cloneTemplate,
  customizeProject
};
