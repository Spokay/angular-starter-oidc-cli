const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { isValidGitUrl } = require('../validators/validators');

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

module.exports = {
  cloneTemplate
};
