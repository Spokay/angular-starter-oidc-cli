const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');

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
      '__APP_NAME__': config.packageName, // npm-friendly package name
      '__APP_DISPLAY_NAME__': config.displayName, // user-friendly display name
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

module.exports = {
  replaceTokens,
  extractRealm
};
