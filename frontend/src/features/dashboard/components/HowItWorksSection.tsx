/**
 * HowItWorksSection - 「仕組み」セクション
 * 生成一時停止中でも、Learnify が何をどう作るかをテキストで伝える
 */

import { HOW_IT_WORKS_STEPS } from './howItWorksSteps';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '8px 32px 32px 32px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    counterReset: 'step',
  },
  item: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
  },
  stepNumber: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '6px',
  },
  stepTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '6px',
  },
  stepDescription: {
    fontSize: '13px',
    color: '#4b5563',
    lineHeight: '1.5',
    margin: 0,
  },
};

export default function HowItWorksSection() {
  return (
    <section style={styles.container} aria-labelledby="how-it-works-title">
      <h2 id="how-it-works-title" style={styles.title}>
        仕組み
      </h2>
      <ol style={styles.list}>
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <li key={step.title} style={styles.item}>
            <div style={styles.stepNumber}>STEP {index + 1}</div>
            <div style={styles.stepTitle}>{step.title}</div>
            <p style={styles.stepDescription}>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
