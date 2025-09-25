const { Toolkit } = require('actions-toolkit');
const core = require('@actions/core');

const getConfig = require('./utils/config');

const defaults = {
  projects: ['PROJ'],
  check_title: true,
  check_branch: false,
  check_commits: false,
  check_description: false,
  ignore_case: false,
  require_brackets: true,
  check_logic: 'and',
};

function createProjectRegex(project, ignoreCase = false) {
  if (ignoreCase) {
    return new RegExp(`${project}[-_]\\d*`, 'i');
  }
  return new RegExp(`${project}[-_]\\d*`);
}
function findFailedCommits(projects, commitsInPR, ignoreCase) {
  const failedCommits = [];
  commitsInPR.forEach((commit) => {
    if (!projects.some((project) => commit.commit.message.match(createProjectRegex(project, ignoreCase)))) {
      failedCommits.push(commit.commit.message);
    }
  });
  return failedCommits;
}

function createWrappedProjectRegex(project, requireBrackets = false) {
  if (requireBrackets) {
    return new RegExp(`\\[${project}-\\d*\\]`);
  }
  return new RegExp(`${project}[-_]\\d*`);
}

Toolkit.run(
  async (tools) => {
    const { repository, pull_request } = tools.context.payload;

    const repoInfo = {
      owner: repository.owner.login,
      repo: repository.name,
      ref: pull_request.head.ref,
    };

    // Get config path from input, default to 'pr-lint.yml' for backwards compatibility
    const configPath = core.getInput('config_path') || 'pr-lint.yml';
    const customErrorMessage = core.getInput('custom_error_message');

    const config = {
      ...defaults,
      ...(await getConfig(tools.github, configPath, repoInfo)),
    };

    const title = config.ignore_case
      ? pull_request.title.toLowerCase()
      : pull_request.title;

    const head_branch = config.ignore_case
      ? pull_request.head.ref.toLowerCase()
      : pull_request.head.ref;

    const description = config.ignore_case
      ? (pull_request.body || '').toLowerCase()
      : (pull_request.body || '');

    const projects = config.projects.map((project) => (config.ignore_case ? project.toLowerCase() : project));
    const title_passed = (() => {
      if (config.check_title) {
        // check the title matches [PROJECT-1234] somewhere
        if (!projects.some((project) => title.match(createWrappedProjectRegex(project, config.require_brackets)))) {
          tools.log(`PR title ${title} does not contain approved project with format [PROJECT-1234]`);
          return false;
        }
      }
      return true;
    })();

    const branch_passed = (() => {
      // check the branch matches PROJECT-1234 or PROJECT_1234 somewhere
      if (config.check_branch) {
        if (!projects.some((project) => head_branch.match(createProjectRegex(project)))) {
          tools.log(`PR branch ${head_branch} does not contain an approved project with format PROJECT-1234 or PROJECT_1234`);
          return false;
        }
      }
      return true;
    })();

    const description_passed = (() => {
      if (config.check_description) {
        // check the description matches [PROJECT-1234] somewhere
        const descriptionMatches = projects.some(
          (project) => description.match(createWrappedProjectRegex(project, config.require_brackets)),
        );
        if (!descriptionMatches) {
          tools.log('PR description does not contain approved project with format [PROJECT-1234]');
          return false;
        }
      }
      return true;
    })();

    const commits_passed = await (async () => {
      // check the branch matches PROJECT-1234 or PROJECT_1234 somewhere
      if (config.check_commits) {
        const listCommitsParams = {
          owner: repository.owner.login,
          repo: repository.name,
          pull_number: pull_request.number,
        };
        const commitsInPR = (await tools.github.pulls.listCommits(listCommitsParams)).data;
        const failedCommits = findFailedCommits(projects, commitsInPR, config.ignore_case);

        if (failedCommits.length) {
          failedCommits.forEach(
            (failedCommit) => tools.log(`Commit message '${failedCommit}' does not contain an approved project`),
          );
          return false;
        }
      }
      return true;
    })();

    const statuses = [title_passed, branch_passed, description_passed, commits_passed];

    if (config.check_logic === 'or') {
      const enabledStatuses = [];
      if (config.check_title) enabledStatuses.push(title_passed);
      if (config.check_branch) enabledStatuses.push(branch_passed);
      if (config.check_description) enabledStatuses.push(description_passed);
      if (config.check_commits) enabledStatuses.push(commits_passed);

      if (enabledStatuses.length === 0 || enabledStatuses.every((status) => status === false)) {
        const errorMessage = customErrorMessage || 'PR Linting Failed - no checks passed';
        if (customErrorMessage) {
          tools.log('');
          tools.log(customErrorMessage);
        }
        tools.exit.failure(errorMessage);
      } else {
        tools.exit.success();
      }
    } else if (statuses.some((status) => status === false)) {
      const errorMessage = customErrorMessage || 'PR Linting Failed';
      if (customErrorMessage) {
        tools.log('');
        tools.log(customErrorMessage);
      }
      tools.exit.failure(errorMessage);
    } else {
      tools.exit.success();
    }
  },
  {
    event: [
      'pull_request.opened',
      'pull_request.edited',
      'pull_request.reopened',
      'pull_request.synchronize',
      'pull_request.ready_for_review',
    ],
    secrets: ['GITHUB_TOKEN'],
  },
);
