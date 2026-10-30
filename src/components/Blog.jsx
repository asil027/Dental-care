import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight, User, X } from 'lucide-react';

export default function Blog({ articles = [] }) {
  const [activeArticle, setActiveArticle] = useState(null);

  return (
    <section id="blog" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block text-xs font-bold text-[#0756A6] tracking-wider uppercase bg-blue-50 px-3.5 py-1 rounded-full mb-3">
            DENTAL ADVICE & NEWS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#092C59] tracking-tight">
            Latest Oral Health Articles
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Expert insights from our dental surgeons to keep your smile glowing and healthy.
          </p>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.slice(0, 3).map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 hover:border-blue-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Article Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={post.image || 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0756A6] shadow-xs">
                    {post.category || 'Oral Health'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.published_at || 'Recent'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.read_time || '4 min read'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#092C59] group-hover:text-[#0756A6] transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {post.short_desc}
                  </p>
                </div>
              </div>

              {/* Read More Footer */}
              <div className="px-6 pb-6 pt-2 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  By {post.author || 'Dental Specialist'}
                </span>

                <button
                  onClick={() => setActiveArticle(post)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0756A6] group-hover:text-[#092C59] group-hover:translate-x-1 transition-all cursor-pointer"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

      </div>

      {/* Full Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-blue-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {activeArticle.image && (
              <div className="rounded-2xl overflow-hidden h-56 w-full mb-6">
                <img
                  src={activeArticle.image}
                  alt={activeArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0756A6] font-bold">
                {activeArticle.category}
              </span>
              <span>{activeArticle.published_at}</span>
              <span>•</span>
              <span>{activeArticle.read_time}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">By {activeArticle.author}</span>
            </div>

            <h3 className="text-2xl font-black text-[#092C59] leading-tight mb-4">
              {activeArticle.title}
            </h3>

            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-4 border-t border-slate-100 pt-4">
              <p className="font-medium text-slate-900 italic text-base">
                {activeArticle.short_desc}
              </p>
              <div className="whitespace-pre-line">
                {activeArticle.content}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#092C59] hover:bg-[#0756A6] transition"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

