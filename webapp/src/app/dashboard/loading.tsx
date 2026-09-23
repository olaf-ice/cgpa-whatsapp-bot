export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 animate-pulse">
      <div className="max-w-6xl mx-auto w-full mt-4 space-y-6">
        
        {/* Header Skeleton */}
        <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-8"></div>

        {/* Top Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-gray-200 rounded-3xl"></div>
          <div className="h-32 bg-gray-200 rounded-3xl"></div>
          <div className="h-32 bg-gray-200 rounded-3xl"></div>
          <div className="h-32 bg-gray-200 rounded-3xl"></div>
        </div>

        {/* Main Content Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-3xl"></div>
          <div className="h-96 bg-gray-200 rounded-3xl"></div>
        </div>

      </div>
    </div>
  )
}
