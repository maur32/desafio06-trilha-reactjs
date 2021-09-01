import Link from 'next/link';
import styles from '../PreviewButton/previewButton.module.scss';

export default function PreviewButton({ children }) {
  return (
    <aside className={styles.previewButton}>
      <Link href="/api/exit-preview">
        <a>{children}</a>
      </Link>
    </aside>
  );
}
