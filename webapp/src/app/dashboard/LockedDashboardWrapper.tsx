'use client'

import dynamic from 'next/dynamic'

const LockedDashboard = dynamic(() => import('./LockedDashboard'), { ssr: false })

interface LockedDashboardWrapperProps {
  email: string;
  name: string;
}

export default function LockedDashboardWrapper({ email, name }: LockedDashboardWrapperProps) {
  return <LockedDashboard email={email} name={name} />
}
