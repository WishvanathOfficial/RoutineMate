import styles from './Pagination.module.scss';

type Props = { page: number; totalPages: number; onChange: (page: number) => void };
export default function Pagination({ page, totalPages, onChange }: Props) {
  const pageCount = Math.max(1, totalPages);
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <button
          type="button"
          key={number}
          className={number === page ? styles.active : ''}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
