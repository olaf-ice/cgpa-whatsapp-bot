'use client'

import { useState } from 'react'
import { MessageSquare, Star, Search, PlusCircle, ChevronLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { submitReview } from './actions'

interface Review {
  id: string;
  course_code: string;
  rating: number;
  advice_text: string;
  created_at: string;
  author: { name: string } | null;
}

export default function ReviewsClient({ initialReviews, searchQuery }: { initialReviews: Review[], searchQuery: string | null }) {
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery || '')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newReview, setNewReview] = useState({ courseCode: '', rating: 5, adviceText: '', isAnonymous: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/dashboard/reviews?q=${encodeURIComponent(search.trim())}`)
    } else {
      router.push(`/dashboard/reviews`)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newReview.courseCode || !newReview.adviceText) {
      setError('Course code and advice are required.')
      return
    }
    
    setIsSubmitting(true)
    const res = await submitReview(newReview)
    
    if (res.error) {
      setError(res.error)
      setIsSubmitting(false)
    } else {
      setIsSubmitting(false)
      setIsModalOpen(false)
      setNewReview({ courseCode: '', rating: 5, adviceText: '', isAnonymous: false })
      // Auto-search for the course just submitted
      router.push(`/dashboard/reviews?q=${encodeURIComponent(newReview.courseCode)}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo-500" /> Course Reviews
              </h1>
              <p className="text-gray-500 font-medium text-sm">
                Get advice and tips from students who took the course.
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <PlusCircle className="w-5 h-5" /> Write Review
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by course code (e.g. MTH 101)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <button type="submit" className="px-6 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors">
            Search
          </button>
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          {initialReviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                {searchQuery ? `Nobody has reviewed ${searchQuery} yet. Be the first to share your experience!` : "No reviews have been posted in your institution yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {initialReviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-lg text-sm tracking-widest">
                      {review.course_code}
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-yellow-700 text-sm">{review.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium mb-6 leading-relaxed">
                    "{review.advice_text}"
                  </p>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 border-t border-gray-50 pt-4 mt-auto">
                    <div className="flex items-center gap-1.5">
                      {review.author ? (
                        <span>By {review.author.name}</span>
                      ) : (
                        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Anonymous</span>
                      )}
                    </div>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Write a Review</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm">{error}</div>}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Course Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MTH 101"
                    maxLength={10}
                    value={newReview.courseCode}
                    onChange={(e) => setNewReview({...newReview, courseCode: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty / Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({...newReview, rating: star})}
                        className={`p-2 rounded-xl transition-all ${newReview.rating >= star ? 'bg-yellow-100 text-yellow-500' : 'bg-gray-50 text-gray-300'}`}
                      >
                        <Star className={`w-6 h-6 ${newReview.rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">1 = Extremely Hard, 5 = Easy A</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Advice & Tips</label>
                  <textarea 
                    placeholder="What should students know before taking this course? (e.g. Focus on past questions, lecturer is strict on attendance)"
                    rows={4}
                    value={newReview.adviceText}
                    onChange={(e) => setNewReview({...newReview, adviceText: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="anon"
                    checked={newReview.isAnonymous}
                    onChange={(e) => setNewReview({...newReview, isAnonymous: e.target.checked})}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="anon" className="text-sm font-bold text-gray-700 cursor-pointer">Post Anonymously</label>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
