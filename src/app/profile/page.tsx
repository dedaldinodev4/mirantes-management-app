'use client'

import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useProjectsStore } from '@/stores/projects.store'
import { formatDate } from '@/utils'

export default function ProfilePage() {
  const { profile } = useAuthStore()
  const { projects, tasks } = useProjectsStore()

  const myTasks = tasks.filter((t) => t.assigneeId === profile?.uid)
  const doneTasks = myTasks.filter((t) => t.status === 'Done')

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title="Profile" breadcrumbs={[{ label: 'Profile' }]} />
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-xl space-y-5">
            {/* Hero card */}
            <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
              {profile && <Avatar name={profile.displayName} photoURL={profile.photoURL} size="lg" />}
              <div>
                <h1 className="text-base font-semibold text-foreground">{profile?.displayName}</h1>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Owner</span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Pro</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Projects', value: projects.length },
                { label: 'Tasks assigned', value: myTasks.length },
                { label: 'Completed', value: doneTasks.length },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-semibold text-foreground">{s.value}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Member since */}
            {profile?.createdAt && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">
                  Member since <span className="text-foreground font-medium">{formatDate(profile.createdAt)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
