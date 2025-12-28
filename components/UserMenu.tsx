'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    return (
      <button
        onClick={() => router.push('/auth/signin')}
        className="pixel-button px-3 py-2 text-xs"
      >
        <User className="w-4 h-4 inline mr-2" />
        登入
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user?.image && (
        <img
          src={session.user.image}
          alt={session.user.name || 'User'}
          className="w-8 h-8 rounded-full border-2 border-black"
        />
      )}
      <span className="text-xs hidden sm:inline">{session.user?.name || session.user?.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        className="pixel-button px-3 py-2 text-xs"
        title="登出"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}

