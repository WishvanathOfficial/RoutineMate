import { Link } from 'react-router-dom';
import { PublicRoadmapContent } from './PublicRoadmapContent';
import styles from './feedback.module.scss';

export default function RoadmapPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2>Public Roadmap</h2>
          <p>See what the community is asking for and what the team is working on.</p>
        </div>
        <Link className={styles.roadmapLink} to="/feedback">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to feedback
        </Link>
      </header>

      <PublicRoadmapContent />
    </div>
  );
}
