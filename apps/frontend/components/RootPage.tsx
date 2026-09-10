'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Organization } from '@prisma/client'
import Link from 'next/link'
import { AiOutlinePlus } from 'react-icons/ai'
import { HiOutlineBuildingOffice2, HiOutlineSparkles, HiArrowRight } from 'react-icons/hi2'
import { orgGet } from '../services/organization'

export default function RootPage() {
  const { push } = useRouter()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orgGet().then((res) => {
      const { data, status } = res.data || {}
      setLoading(false)
      if (status !== 200 || !data) return

      if (!data.length) {
        push('/organization/create')
        return
      }

      setOrgs(data)
    }).catch(() => {
      setLoading(false)
    })
  }, [push])

  const getGradient = (name: string) => {
    const gradients = [
      'from-indigo-600 to-purple-600',
      'from-blue-600 to-cyan-600',
      'from-emerald-600 to-teal-600',
      'from-rose-600 to-pink-600',
      'from-amber-600 to-orange-600'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return gradients[Math.abs(hash) % gradients.length]
  }

  return (
    <div className="min-h-screen w-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <HiOutlineSparkles className="w-4 h-4 text-indigo-500" />
            CRM Workspace Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            Select Your Organization
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Choose an organization to open your WhatsApp-style chat CRM and manage projects with your team.
          </p>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Create Organization Card */}
          <Link href="/organization/create">
            <div className="h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white/50 dark:bg-gray-900/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all p-5 flex flex-col items-center justify-center text-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-600 group-hover:text-white text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors">
                <AiOutlinePlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Create New Organization
              </span>
            </div>
          </Link>

          {/* Org Cards */}
          {orgs.map((org) => {
            const initial = (org.name || 'O').trim().charAt(0).toUpperCase()
            return (
              <Link key={org.id} href={`/${org.slug}`}>
                <div className="group h-32 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-5 flex flex-col justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    {org.avatar && org.avatar.startsWith('http') ? (
                      <img
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                        src={org.avatar}
                        alt={org.name}
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getGradient(
                          org.name
                        )} flex items-center justify-center text-white font-bold text-base shadow-xs`}
                      >
                        {initial}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {org.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 truncate">
                        crm.technewity/{org.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] font-semibold text-gray-400 group-hover:text-indigo-500 transition-colors">
                    <span>Enter Workspace</span>
                    <HiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
