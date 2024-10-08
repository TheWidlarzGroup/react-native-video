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
  FEATURE_REQUEST: `Thank you for your feature request. We will review it and get back to you if we need more information.`,
  BUG_REPORT: `Thank you for your bug report. We will review it and get back to you if we need more information.`,
  MISSING_INFO: (missingFields) => {
    return `Thank you for your issue report. Please note that the following information is missing or incomplete:\n\n${missingFields
      .map((field) => `- ${field.replace('missing-', '')}`)
      .join(
        '\n',
      )}\n\nPlease update your issue with this information to help us address it more effectively. 
      \n > Note: issues without complete information have a lower priority`;
  },
  OUTDATED_VERSION: (issueVersion, latestVersion) => {
    return (
      `There is a newer version of the library available. ` +
      `You are using version ${issueVersion}, while the latest stable version is ${latestVersion}. ` +
      `Please update to the latest version and check if the issue still exists.` +
      `\n > Note: If the issue still exists, please update the issue report with the latest information.`
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

  const botComments = comments.data.filter(
    (comment) => comment.user.type === 'Bot',
  );

  for (const comment of botComments) {
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
