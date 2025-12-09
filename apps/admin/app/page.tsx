import Link from 'next/link';
import styles from './page.module.css';

export default function AdminHome() {
  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1>Tap &amp; Stamp Admin</h1>
        <p>Wallet-based loyalty management for cafés</p>
      </div>

      <div className={styles.cards}>
        <Link href="/branding/new" className={styles.card}>
          <h2>Create Merchant Branding</h2>
          <p>Set up loyalty card branding for Apple and Google Wallet</p>
          <span className={styles.arrow}>→</span>
        </Link>

        <div className={styles.card + ' ' + styles.disabled}>
          <h2>Manage Merchants</h2>
          <p>View and edit existing merchants</p>
          <span className={styles.comingSoon}>Coming Soon</span>
        </div>

        <div className={styles.card + ' ' + styles.disabled}>
          <h2>Analytics</h2>
          <p>View member stats and redemptions</p>
          <span className={styles.comingSoon}>Coming Soon</span>
        </div>
      </div>
    </main>
  );
}
