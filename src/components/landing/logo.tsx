import Link from 'next/link';
import Image from 'next/image';

export function Logo() {
  return (
    <Link
      href="/landing"
      className="flex items-center gap-2 text-2xl font-bold font-headline text-white transition-colors hover:text-primary"
    >
      <Image src="/logo.png" alt="Kyozo Logo" width={128} height={32} />
    </Link>
  );
}
