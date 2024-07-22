const getFieldValue = (body, field) => {
  const fields = {
    Platform: 'What platforms are you having the problem on?',
    Version: 'Version',
    SystemVersion: 'System Version',
    DeviceType: 'On what device are you experiencing the issue?',
    Architecture: 'Architecture',
    Description: 'What happened?',
    ReproductionLink: 'Reproduction Link',
    Reproduction: 'Reproduction',
  };

  if (!fields[field]) {
    console.warn('Field not supported:', field);
    return '';
  }

  const sections = body.split('###');
  const section = sections.find((section) => section.includes(fields[field]));

  if (!section) {
    return '';
  }

  return section.replace(fields[field], '').trim();
};

const validateBugReport = (body, labels) => {
  const selectedPlatforms = getFieldValue(body, 'Platform')
    .split(',')
    .map((platform) => platform.trim());

  if (selectedPlatforms.length === 0) {
    labels.add('missing-platform');
  } else {
    selectedPlatforms.forEach((platform) => {
      if (['iOS', 'visionOS', 'Apple tvOS'].includes(platform)) {
        labels.add('Platform: iOS');
      } else if (['Android', 'Android TV'].includes(platform)) {
        labels.add('Platform: Android');
      } else if (platform === 'Windows') {
        labels.add('Platform: Windows');
      } else {
        console.warn('Platform not supported', platform);
      }
    });
  }

  // Validate version
  const version = getFieldValue(body, 'Version');
  if (!version || version === 'Put the exact version from your package.json') {
    labels.add('missing-version');
  }

  // Validate system version
  const systemVersion = getFieldValue(body, 'SystemVersion');
  if (
    !systemVersion ||
    systemVersion ===
      'What version of the system is using device that you are experiencing the issue?'
  ) {
    labels.add('missing-system');
  }

  // Validate device
  const device = getFieldValue(body, 'DeviceType');
  if (device === '') {
    labels.add('missing-device');
  }

  // Validate architecture
  const architecture = getFieldValue(body, 'Architecture');
  if (architecture === '') {
    labels.add('missing-architecture');
  }

  // Validate what happened
  const whatHappened = getFieldValue(body, 'Description');
  if (!whatHappened || whatHappened === 'A bug happened!') {
    labels.add('missing-bug-description');
  }

  // Validate reproduction steps
  const reproSteps = getFieldValue(body, 'Reproduction');
  if (!reproSteps || reproSteps === 'Step to reproduce this bug are: ') {
    labels.add('missing-reproduction-steps');
  }

  // Validate reproduction repository
  const reproRepo = getFieldValue(body, 'ReproductionLink');
  if (!reproRepo || reproRepo === 'repository link') {
    labels.add('missing-reproduction-repo');
  }
};

const validateFeatureRequest = (body, labels) => {};

module.exports = async ({github, context}) => {
  const issue = context.payload.issue;
  const body = issue.body;
  const labels = new Set(issue.labels.map((label) => label.name));

  // Clear out labels that are added by the bot

  if (labels.has('Missing Info')) {
    labels.delete('Missing Info');
  }

  if (labels.has('Repro Provided')) {
    labels.delete('Repro Provided');
  }

  if (labels.has('Missing Repro')) {
    labels.delete('Missing Repro');
  }

  if (labels.has('Waiting for Review')) {
    labels.delete('Waiting for Review');
  }

  const isBug = labels.has('bug');
  const isFeature = labels.has('feature');

  if (isFeature) {
    validateFeatureRequest(body, labels);

    const comment = `Thank you for your feature request. We will review it and get back to you if we need more information.`;

    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issue.number,
      body: comment,
    });
  } else if (isBug) {
    validateBugReport(body, labels);

    // Add a comment if there are missing fields
    if (labels.size > issue.labels.length) {
      const missingFields = Array.from(labels).filter((label) =>
        label.startsWith('missing-'),
      );
      if (missingFields.length > 0) {
        const comment = `Thank you for your issue report. Please note that the following information is missing or incomplete:\n\n${missingFields
          .map((field) => `- ${field.replace('missing-', '')}`)
          .join(
            '\n',
          )}\n\nPlease update your issue with this information to help us address it more effectively.`;

        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issue.number,
          body: comment,
        });
      }

      // If there is missing repro add "Missing repro" label
      // If there is any other missing information add "Missing Info" label
      if (labels.has('missing-reproduction-steps')) {
        labels.add('Missing Repro');
      }

      if (labels.size > issue.labels.length) {
        labels.add('Missing Info');
      }
    } else {
      const comment = `Thank you for your issue report. We will review it and get back to you if we need more information.`;

      labels.add('Repro Provided');
      labels.add('Waiting for Review');

      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.number,
        body: comment,
      });
    }
  } else {
    console.warn('Issue is not a bug or feature request');
  }

  // Add labels to the issue
  const labelsToAdd = Array.from(labels).filter(
    (label) => !label.startsWith('missing-'),
  );

  if (labelsToAdd.length > 0) {
    await github.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issue.number,
      labels: labelsToAdd,
    });
  }
};
