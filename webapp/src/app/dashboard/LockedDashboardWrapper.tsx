'use client'

import dynamic from 'next/dynamic'

const LockedDashboard = dynamic(() => import('./LockedDashboard'), { ssr: false })

interface LockedDashboardWrapperProps {
  email: string;
  name: string;
  amount: number;
}

export default function LockedDashboardWrapper({ email, name, amount }: LockedDashboardWrapperProps) {
  return <LockedDashboard email={email} name={name} amount={amount} />
}
