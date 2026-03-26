import React from 'react';
import styles from './DecisionTable.module.css';

interface DecisionRow {
  situation: string;
  choose: string;
  result: string;
  chooseVariant?:
    | 'community'
    | 'booster'
    | 'support'
    | 'extensions'
    | 'migration';
}

const DECISIONS: DecisionRow[] = [
  {
    situation: "I'm just integrating video",
    choose: 'Community',
    result: 'Best-effort help + docs',
    chooseVariant: 'community',
  },
  {
    situation: 'A crash/bug blocks release',
    choose: 'Issue Booster',
    result: 'ASAP fix (PR/patch/release)',
    chooseVariant: 'booster',
  },
  {
    situation: 'We need ongoing maintainer help',
    choose: 'Support plan',
    result: 'Stability + guidance over time',
    chooseVariant: 'support',
  },
  {
    situation: 'We want to switch from another player',
    choose: 'Migration',
    result: 'Lower costs + full control',
    chooseVariant: 'migration',
  },
  {
    situation: 'We need offline / chapters / custom UI',
    choose: 'Extensions',
    result: 'Advanced capabilities',
    chooseVariant: 'extensions',
  },
];

export function DecisionTable() {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Situation</th>
            <th className={styles.th}>Choose</th>
            <th className={styles.th}>Result</th>
          </tr>
        </thead>
        <tbody>
          {DECISIONS.map((row) => (
            <tr key={row.situation} className={styles.row}>
              <td className={styles.td}>
                <span className={styles.situation}>"{row.situation}"</span>
              </td>
              <td className={styles.td}>
                <span
                  className={`${styles.choose} ${styles[row.chooseVariant || 'community']}`}
                >
                  {row.choose}
                </span>
              </td>
              <td className={styles.td}>
                <span className={styles.result}>{row.result}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
