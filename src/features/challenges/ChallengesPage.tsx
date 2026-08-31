import { Link } from 'react-router-dom';
import { featureFlags } from '../../config/featureFlags';

export default function ChallengesPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Challenges</h2>
          <p>Build consistency together with friends.</p>
        </div>
        <Link to="/friends">Find friends</Link>
      </div>
      {featureFlags.challenges ? (
        <p>Challenges are ready to browse.</p>
      ) : (
        <div role="status">
          <h3>Challenges are being prepared</h3>
          <p>
            Invite friends and build routine bundles while the challenge experience is being
            finalized.
          </p>
          <Link to="/routines/bundles/new">Create a routine bundle</Link>
        </div>
      )}
    </div>
  );
}
