import React from 'react';
import styles from './V7ApiModel.module.css';

const USE_CASES = [
  {
    title: 'Video feeds / lists',
    description:
      'Prepare upcoming players in advance for smoother scrolling and fewer glitches.',
  },
  {
    title: 'Faster playback start',
    description:
      'Preload before the user clicks "play" / before the screen appears.',
  },
];

export function V7ApiModel() {
  return (
    <div className={styles.container}>
      <p className={styles.text}>
        In v6, "player = view". In v7, the player is a separate entity: you can
        pass it as a prop to a view or prepare it in advance before rendering
        anything.
      </p>
      <div className={styles.useCases}>
        {USE_CASES.map((useCase) => (
          <div key={useCase.title} className={styles.useCase}>
            <h4 className={styles.useCaseTitle}>{useCase.title}</h4>
            <p className={styles.useCaseDescription}>{useCase.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
