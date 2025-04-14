const FIELD_MAPPINGS = {
  Platform: 'What platforms are you having the problem on?',
  Version: 'Version',
  SystemVersion: 'System Version',
  DeviceType: 'On what device are you experiencing the issue?',
  Architecture: 'Architecture',
  Description: 'What happened?',
  ReproductionLink: 'Reproduction Link',
  Reproduction: 'Reproduction',
};

const PLATFORM_LABELS = {
  iOS: 'Platform: iOS',
  visionOS: 'Platform: iOS',
  'Apple tvOS': 'Platform: iOS',
  Android: 'Platform: Android',
  'Android TV': 'Platform: Android',
  Windows: 'Platform: Windows',
  web: 'Platform: Web',
};

const BOT_LABELS = [
  'Missing Info',
  'Repro Provided',
  'Missing Repro',
  'Waiting for Review',
  'Newer Version Available',
  ...Object.values(PLATFORM_LABELS),
];

const SKIP_LABEL = 'No Validation';

const MESSAGE = {
  FEATURE_REQUEST: `Thanks for the feature request! 🚀
    You can check out our [public roadmap](https://github.com/orgs/TheWidlarzGroup/projects/6) to see what we're currently working on. All requests are automatically added there, so you can track progress anytime.
    We review and implement new features when time allows, but this can take a while. If you’d like to speed things up and make this a priority, consider [Issue Boost](https://www.thewidlarzgroup.com/issue-boost/?utm_source=rnv&utm_medium=feature-request&utm_campaign=bot&utm_id=bot-message), our commercial option that lets us dedicate time specifically to your request.
    Thanks for your input and patience! 🙌`,
  BUG_REPORT: `Hey! 👋  
    Thanks for reporting this issue. We try to fix bugs as quickly as possible, but since our time is limited, we prioritize sponsored issues first, then focus on critical problems affecting many users, and finally, we handle other reports when we can. Some issues might take a while to be resolved.  
    If you want to speed up this process, check out [Issue Boost](https://www.thewidlarzgroup.com/issue-boost/?utm_source=rnv&utm_medium=bug-report&utm_campaign=bot&utm_id=bot-message) – it allows us to dedicate time specifically to your issue and fix it faster.  
    Thanks for your patience and support! 🚀`,
  MISSING_INFO: (missingFields) => {
    return `Hey! 👋  
      Thanks for the bug report. To help us resolve your issue effectively, we still need some key information:\n\n${missingFields
        .map((field) => `- ${field.replace('missing-', '')}`)
        .join('\n')}
    
      Please edit your issue and fill in the missing details.  
      > Issues with incomplete info are treated with lower priority, so this helps speed things up.
      
      Need faster resolution? Consider [Issue Boost](https://www.thewidlarzgroup.com/issue-boost/?utm_source=rnv&utm_medium=missing-info&utm_campaign=bot&utm_id=bot-message) to prioritize your issue. 🚀`;
  },
  OUTDATED_VERSION: (issueVersion, latestVersion) => {
    return (
      `Heads up! ⚠️ You're using version **${issueVersion}**, but the latest stable version is **${latestVersion}**. ` +
      `Please update to the newest version and check if the issue still occurs.\n\n` +
      `> Keeping your dependencies up-to-date often resolves many common problems.` +
      `\n\nStill having the issue after upgrading? Update the report with the new version details so we can investigate.` +
      `\n\nNeed this resolved faster? [Issue Boost](https://www.thewidlarzgroup.com/issue-boost/?utm_source=rnv&utm_medium=outdated&utm_campaign=bot&utm_id=bot-message) lets us prioritize and fix your issue sooner. 🚀`
    );
  },
};

const checkLatestVersion = async () => {
  try {
    const response = await fetch(
      'https://registry.npmjs.org/react-native-video/latest',
    );
    const data = await response.json();
    return data.version;
  } catch (error) {
    console.error('Error checking latest version:', error);
    return null;
  }
};

const getFieldValue = (body, field) => {
  if (!FIELD_MAPPINGS[field]) {
    console.warn('Field not supported:', field);
    return '';
  }

  const fieldValue = FIELD_MAPPINGS[field];

  const sections = body.split('###');
  const section = sections.find((section) => {
    // Find the section that contains the field
    // For Reproduction, we need to make sure that we don't match Reproduction Link
    if (field === 'Reproduction') {
      return (
        section.includes(fieldValue) && !section.includes('Reproduction Link')
      );
    }

    return section.includes(fieldValue);
  });

  return section ? section.replace(fieldValue, '').trim() : '';
};

const validateBugReport = async (body, labels) => {
  const selectedPlatforms = getFieldValue(body, 'Platform')
    .split(',')
    .map((p) => p.trim());

  if (selectedPlatforms.length === 0) {
    labels.add('missing-platform');
  } else {
    selectedPlatforms.forEach((platform) => {
      const label = PLATFORM_LABELS[platform];
      if (label) {
        labels.add(label);
      } else {
        console.warn('Platform not supported', platform);
      }
    });
  }

  const version = getFieldValue(body, 'Version');
  if (version) {
    const words = version.split(' ');
    const versionPattern = /\d+\.\d+\.\d+/;
    const isVersionValid = words.some((word) => versionPattern.test(word));

    if (!isVersionValid) {
      labels.add('missing-version');
    }

    const latestVersion = await checkLatestVersion();
    if (latestVersion && latestVersion !== version) {
      labels.add(`outdated-version-${version}-${latestVersion}`);
    }
  }

  const fields = [
    {
      name: 'SystemVersion',
      invalidValue:
        'What version of the system is using device that you are experiencing the issue?',
    },
    {name: 'DeviceType'},
    {name: 'Architecture'},
    {name: 'Description', invalidValue: 'A bug happened!'},
    {name: 'Reproduction', invalidValue: 'Step to reproduce this bug are:'},
    {name: 'ReproductionLink', invalidValue: 'repository link'},
  ];

  fields.forEach(({name, invalidValue}) => {
    const value = getFieldValue(body, name);
    if (!value || value === invalidValue) {
      const fieldName = FIELD_MAPPINGS[name];
      labels.add(`missing-${fieldName.toLowerCase()}`);
    }
  });
};

const validateFeatureRequest = (body, labels) => {
  // Implement feature request validation logic here
};

const handleIssue = async ({github, context}) => {
  const {issue} = context.payload;
  const {body} = issue;
  const labels = new Set(issue.labels.map((label) => label.name));

  if (labels.has(SKIP_LABEL)) {
    console.log('Skiping Issue Validation');
    return;
  }

  // Clear out labels that are added by the bot
  BOT_LABELS.forEach((label) => labels.delete(label));

  const isBug = labels.has('bug');
  const isFeature = labels.has('feature');

  if (isFeature) {
    await handleFeatureRequest({github, context, body, labels});
  } else if (isBug) {
    await handleBugReport({github, context, body, labels});
  } else {
    console.warn('Issue is not a bug or feature request');
  }

  await updateIssueLabels({github, context, labels});
};

const handleFeatureRequest = async ({github, context, body, labels}) => {
  validateFeatureRequest(body, labels);

  const comment = MESSAGE.FEATURE_REQUEST;
  await createComment({github, context, body: comment});
};

const handleBugReport = async ({github, context, body, labels}) => {
  await validateBugReport(body, labels);

  if (Array.from(labels).some((label) => label.startsWith('missing-'))) {
    await handleMissingInformation({github, context, labels});
  } else {
    await handleValidReport({github, context, labels});
  }
};

const handleMissingInformation = async ({github, context, labels}) => {
  const missingFields = Array.from(labels).filter((label) =>
    label.startsWith('missing-'),
  );

  const outdatedVersionLabel = Array.from(labels).find((label) =>
    label.startsWith('outdated-version'),
  );

  if (missingFields.length > 0) {
    let comment = MESSAGE.MISSING_INFO(missingFields);

    if (outdatedVersionLabel) {
      const [, , issueVersion, latestVersion] = outdatedVersionLabel.split('-');
      comment += `\n\n ${MESSAGE.OUTDATED_VERSION(
        issueVersion,
        latestVersion,
      )}`;
    }

    await hidePreviousComments({github, context});
    await createComment({github, context, body: comment});
  }

  updateLabelsForMissingInfo(labels);
};

const handleValidReport = async ({github, context, labels}) => {
  let comment = MESSAGE.BUG_REPORT;

  const outdatedVersionLabel = Array.from(labels).find((label) =>
    label.startsWith('outdated-version'),
  );

  if (outdatedVersionLabel) {
    const [, , issueVersion, latestVersion] = outdatedVersionLabel.split('-');
    comment += `\n\n ${MESSAGE.OUTDATED_VERSION(issueVersion, latestVersion)}`;
    labels.add('Newer Version Available');
  }

  await hidePreviousComments({github, context});
  await createComment({github, context, body: comment});
  labels.add('Repro Provided');
  labels.add('Waiting for Review');
};

const createComment = async ({github, context, body}) => {
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.issue.number,
    body,
  });
};

const updateIssueLabels = async ({github, context, labels}) => {
  const labelsToAdd = Array.from(labels).filter(
    (label) => !label.startsWith('missing-') && !label.startsWith('outdated-'),
  );

  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.issue.number,
    labels: labelsToAdd,
  });
};

const hidePreviousComments = async ({github, context}) => {
  const comments = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.issue.number,
  });

  // Filter for bot comments that aren't already hidden
  const unhiddenBotComments = comments.data.filter(
    (comment) =>
      comment.user.type === 'Bot' &&
      !comment.body.includes('<details>') &&
      !comment.body.includes('Previous bot comment'),
  );

  for (const comment of unhiddenBotComments) {
    // Don't format string - it will broke the markdown
    const hiddenBody = `
<details>
<summary>Previous bot comment (click to expand)</summary>

${comment.body}

</details>`;

    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: comment.id,
      body: hiddenBody,
    });
  }
};

module.exports = handleIssue;
