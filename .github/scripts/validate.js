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
};

const BOT_LABELS = [
  'Missing Info',
  'Repro Provided',
  'Missing Repro',
  'Waiting for Review',
];

const getFieldValue = (body, field) => {
  if (!FIELD_MAPPINGS[field]) {
    console.warn('Field not supported:', field);
    return '';
  }

  const sections = body.split('###');
  const section = sections.find((section) =>
    section.includes(FIELD_MAPPINGS[field]),
  );

  return section ? section.replace(FIELD_MAPPINGS[field], '').trim() : '';
};

const validateBugReport = (body, labels) => {
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

  const fields = [
    {
      name: 'Version',
      invalidValue: 'Put the exact version from your package.json',
    },
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

  const comment = `Thank you for your feature request. We will review it and get back to you if we need more information.`;
  await createComment({github, context, body: comment});
};

const handleBugReport = async ({github, context, body, labels}) => {
  validateBugReport(body, labels);

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

  if (missingFields.length > 0) {
    const comment = `Thank you for your issue report. Please note that the following information is missing or incomplete:\n\n${missingFields
      .map((field) => `- ${field.replace('missing-', '')}`)
      .join(
        '\n',
      )}\n\nPlease update your issue with this information to help us address it more effectively.`;

    await createComment({github, context, body: comment});
  }

  updateLabelsForMissingInfo(labels);
};

const updateLabelsForMissingInfo = (labels) => {
  if (labels.has('missing-reproduction-steps')) {
    labels.add('Missing Repro');
    labels.delete('Repro Provided');
  } else {
    labels.delete('Missing Repro');
    labels.add('Repro Provided');
  }

  labels.add('Missing Info');
  labels.delete('Waiting for Review');
};

const handleValidReport = async ({github, context, labels}) => {
  const comment = `Thank you for your issue report. We will review it and get back to you if we need more information.`;
  await createComment({github, context, body: comment});
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
    (label) => !label.startsWith('missing-'),
  );

  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.issue.number,
    labels: labelsToAdd,
  });
};

module.exports = handleIssue;
