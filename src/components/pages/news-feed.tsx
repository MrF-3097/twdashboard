'use client'

import { useState, useEffect, useRef } from 'react'
import { useTransactions } from '@/hooks/use-commissions'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'
import { Bell, SmilePlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NewsReaction {
  emoji: string
  agentName: string
}

interface NewsItem {
  id: string
  agentName: string
  agentAvatar?: string
  transactionValue: number
  commission: number
  transactionType?: 'Vanzare' | 'Chirie'
  propertyType?: string
  location?: string
  timestamp: Date
  reactions: NewsReaction[]
  reactionCounts: Record<string, number>
}

export const NewsFeed = () => {
  const { agentData } = useAuth()
  const { data: transactions } = useTransactions()
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [rebsAgents, setRebsAgents] = useState<any[]>([])
  const [reactionsData, setReactionsData] = useState<Record<string, { reactions: NewsReaction[]; reactionCounts: Record<string, number> }>>({})
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [longPressItemId, setLongPressItemId] = useState<string | null>(null)

  // Fetch REBS agents for avatar data
  useEffect(() => {
    const fetchRebsAgents = async () => {
      try {
        const response = await fetch('/api/agents')
        const result = await response.json()
        if (result.success && result.data) {
          const agentsList = Array.isArray(result.data) 
            ? result.data 
            : (result.data?.objects || [])
          setRebsAgents(agentsList)
        }
      } catch (err) {
        console.error('Error fetching REBS agents:', err)
      }
    }
    fetchRebsAgents()
  }, [])

  // Fetch reactions data
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const response = await fetch('/api/news/likes')
        const result = await response.json()
        if (result.success && result.data) {
          const reactionsMap: Record<string, { reactions: NewsReaction[]; reactionCounts: Record<string, number> }> = {}
          Object.values(result.data).forEach((item: any) => {
            const reactions = item.reactions || []
            const reactionCounts: Record<string, number> = {}
            reactions.forEach((r: NewsReaction) => {
              reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1
            })
            reactionsMap[item.itemId] = {
              reactions,
              reactionCounts
            }
          })
          setReactionsData(reactionsMap)
        }
      } catch (err) {
        console.error('Error fetching reactions:', err)
      }
    }
    fetchReactions()
  }, [])

  // Convert transactions to news items
  useEffect(() => {
    if (!transactions?.rows) return

    const items: NewsItem[] = transactions.rows
      .filter(t => t.Agent && t['Valoare Tranzactie'])
      .map((t, index) => {
        const agentName = t.Agent
        const rebsAgent = rebsAgents.find(ra => {
          if (ra.first_name && ra.last_name) {
            const fullName = `${ra.first_name} ${ra.last_name}`
            return fullName.toLowerCase() === agentName.toLowerCase()
          }
          return ra.name?.toLowerCase() === agentName.toLowerCase()
        })

        const valoare = typeof t['Valoare Tranzactie'] === 'number' ? t['Valoare Tranzactie'] : 0
        const pct = typeof t['Comision %'] === 'number' 
          ? (t['Comision %'] > 1 ? t['Comision %'] / 100 : t['Comision %']) 
          : 0
        const com = t.Comision && t.Comision > 0 
          ? t.Comision 
          : (valoare * pct)

        let transactionDate: Date
        if (t.Timestamp) {
          transactionDate = new Date(t.Timestamp)
        } else if (t['Data Tranzactie']) {
          transactionDate = new Date(t['Data Tranzactie'])
        } else if (t.Date) {
          transactionDate = new Date(t.Date)
        } else {
          transactionDate = new Date()
        }

        // Determine transaction type (Sale or Rental)
        // closed_transaction_type: 2 = Vânzare, 1 = Închiriere
        const closedTransactionType = t['closed_transaction_type'] || t['Tip Tranzactie'] || t['Transaction Type']
        const transactionType = closedTransactionType === 1 || 
                                closedTransactionType === 'Chirie' || 
                                closedTransactionType === 'Rental' || 
                                closedTransactionType === 'Închiriere'
          ? 'Chirie' 
          : 'Vanzare'

        return {
          id: `${t.Timestamp || t['Data Tranzactie'] || Date.now()}-${index}`,
          agentName,
          agentAvatar: rebsAgent?.profile_picture || rebsAgent?.avatar || rebsAgent?.photo,
          transactionValue: valoare,
          commission: Math.round(com),
          transactionType,
          propertyType: t['Tip Proprietate'] || t['Property Type'],
          location: t['Locatie'] || t['Location'],
          timestamp: transactionDate,
          reactions: reactionsData[`${t.Timestamp || t['Data Tranzactie'] || Date.now()}-${index}`]?.reactions || [],
          reactionCounts: reactionsData[`${t.Timestamp || t['Data Tranzactie'] || Date.now()}-${index}`]?.reactionCounts || {}
        }
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50) // Limit to 50 most recent

    setNewsItems(items)
  }, [transactions?.rows, rebsAgents, reactionsData])

  // Handle long press to show reaction picker
  const handleLongPressStart = (itemId: string) => {
    setLongPressItemId(itemId)
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(itemId)
      setLongPressItemId(null)
    }, 500) // 500ms long press
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setLongPressItemId(null)
  }

  // Handle reaction selection
  const handleReaction = async (itemId: string, emoji: string) => {
    if (!agentData?.name) return

    const currentReactions = reactionsData[itemId]?.reactions || []
    const existingReaction = currentReactions.find(r => r.agentName === agentData.name)
    const isSameReaction = existingReaction?.emoji === emoji
    const action = isSameReaction ? 'remove' : 'add'

    // Optimistic update
    const newReactions = [...currentReactions]
    const existingIndex = newReactions.findIndex(r => r.agentName === agentData.name)
    
    if (action === 'add') {
      if (existingIndex >= 0) {
        newReactions[existingIndex] = { emoji, agentName: agentData.name }
      } else {
        newReactions.push({ emoji, agentName: agentData.name })
      }
    } else {
      if (existingIndex >= 0) {
        newReactions.splice(existingIndex, 1)
      }
    }

    const newReactionCounts: Record<string, number> = {}
    newReactions.forEach(r => {
      newReactionCounts[r.emoji] = (newReactionCounts[r.emoji] || 0) + 1
    })

    setNewsItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, reactions: newReactions, reactionCounts: newReactionCounts }
        : item
    ))

    setReactionsData(prev => ({
      ...prev,
      [itemId]: { reactions: newReactions, reactionCounts: newReactionCounts }
    }))

    // Close picker
    setShowReactionPicker(null)

    // Save to server
    try {
      const response = await fetch('/api/news/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          agentName: agentData.name,
          emoji,
          action
        })
      })

      const result = await response.json()
      if (result.success && result.data) {
        setReactionsData(prev => ({
          ...prev,
          [itemId]: {
            reactions: result.data.reactions || [],
            reactionCounts: result.data.reactionCounts || {}
          }
        }))
        setNewsItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, reactions: result.data.reactions || [], reactionCounts: result.data.reactionCounts || {} }
            : item
        ))
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
      // Revert on error
      setNewsItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, reactions: currentReactions, reactionCounts: reactionsData[itemId]?.reactionCounts || {} }
          : item
      ))
    }
  }

  // Get user's current reaction
  const getUserReaction = (item: NewsItem): string | null => {
    if (!agentData?.name) return null
    const userReaction = item.reactions.find(r => r.agentName === agentData.name)
    return userReaction?.emoji || null
  }

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Acum'
    if (diffMins < 60) return `Acum ${diffMins} min`
    if (diffHours < 24) return `Acum ${diffHours} ore`
    if (diffDays < 7) return `Acum ${diffDays} zile`
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
  }

  return (
    <section className="w-full relative min-h-screen overflow-hidden">
      {/* Simple Dark Background */}
      <div className="absolute inset-0 bg-slate-900 overflow-hidden">
        {/* Animated Stock-Exchange Chart Lines - Subtle background overlay */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg 
            className="absolute inset-0 w-full h-full" 
            preserveAspectRatio="none" 
            viewBox="0 0 1200 800"
            style={{ mixBlendMode: 'screen' }}
          >
            {/* Stock chart lines - subtle background overlay */}
            {[
              { d: "M0,150 L120,130 L240,170 L360,100 L480,200 L600,50 L720,250 L840,80 L960,300 L1080,120 L1200,280", delay: 0, duration: 12 },
              { d: "M0,250 L100,230 L200,270 L300,200 L400,300 L500,150 L600,350 L700,100 L800,400 L900,180 L1000,450 L1100,220 L1200,500", delay: -2, duration: 15 },
              { d: "M0,350 L130,330 L260,370 L390,300 L520,400 L650,250 L780,450 L910,200 L1040,550 L1170,280 L1200,600", delay: -4, duration: 11 },
              { d: "M0,450 L110,430 L220,470 L330,400 L440,500 L550,350 L660,550 L770,300 L880,600 L990,380 L1100,650 L1200,250", delay: -6, duration: 14 },
              { d: "M0,550 L90,530 L180,570 L270,500 L360,600 L450,450 L540,650 L630,400 L720,700 L810,350 L900,750 L990,480 L1080,800 L1170,300 L1200,550", delay: -1, duration: 13 },
              { d: "M0,650 L120,630 L240,670 L360,600 L480,700 L600,550 L720,750 L840,500 L960,800 L1080,450 L1200,680", delay: -3, duration: 16 },
              { d: "M0,100 L80,80 L160,120 L240,50 L320,150 L400,30 L480,200 L560,10 L640,250 L720,60 L800,300 L880,90 L960,350 L1040,40 L1120,400 L1200,150", delay: -5, duration: 10 },
              { d: "M0,750 L95,730 L190,770 L285,700 L380,800 L475,650 L570,780 L665,600 L760,750 L855,550 L950,720 L1045,480 L1140,760 L1200,400", delay: -7, duration: 17 },
              { d: "M0,200 L140,180 L280,220 L420,150 L560,250 L700,100 L840,300 L980,80 L1120,400 L1200,180", delay: -0.5, duration: 11.5 },
              { d: "M0,500 L105,480 L210,520 L315,450 L420,550 L525,400 L630,600 L735,350 L840,650 L945,300 L1050,700 L1155,250 L1200,600", delay: -2.5, duration: 13.5 },
              { d: "M0,300 L115,280 L230,320 L345,250 L460,350 L575,200 L690,400 L805,150 L920,450 L1035,100 L1150,500 L1200,220", delay: -4.5, duration: 12.5 },
              { d: "M0,600 L125,580 L250,620 L375,550 L500,650 L625,500 L750,700 L875,450 L1000,750 L1125,400 L1200,680", delay: -6.5, duration: 15.5 },
              { d: "M0,400 L85,380 L170,420 L255,350 L340,450 L425,300 L510,500 L595,250 L680,550 L765,200 L850,600 L935,150 L1020,650 L1105,100 L1200,500", delay: -1.5, duration: 14.5 },
              { d: "M0,700 L135,680 L270,720 L405,650 L540,750 L675,600 L810,780 L945,550 L1080,800 L1215,450 L1200,720", delay: -3.5, duration: 16.5 },
              { d: "M0,50 L75,30 L150,70 L225,20 L300,100 L375,10 L450,150 L525,40 L600,200 L675,60 L750,250 L825,80 L900,300 L975,50 L1050,350 L1125,30 L1200,400", delay: -5.5, duration: 9.5 },
            ].map((line, index) => (
              <path
                key={index}
                d={line.d}
                fill="none"
                stroke="#FDE047"
                strokeWidth="0.5"
                opacity="0.3"
                className="animate-stock-chart-random"
                style={{
                  animationDelay: `${line.delay}s`,
                  animationDuration: `${line.duration}s`,
                }}
              />
            ))}
          </svg>
        </div>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.05),transparent_60%)]" />
      </div>

      {/* Hero Section - Baby Blue Gradient */}
      <div className="relative w-full pb-8 z-10">
        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-3 md:pt-6">
          <div className="container mx-auto px-3 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 md:py-2.5 bg-white/20 backdrop-blur-md rounded-lg md:rounded-xl border border-white/30 shadow-lg">
              <div className="flex h-7 w-7 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 shadow-md">
                <Bell className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xs md:text-sm font-bold text-white leading-tight">News</h1>
                <p className="text-[9px] md:text-[10px] text-white/70 font-medium leading-tight">Ultimele tranzacții</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fade transition overlay - blend with dark background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-[5]"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(15, 23, 42, 0.95) 100%)'
          }}
        />
      </div>

      {/* News Feed */}
      <div className="relative z-10 px-4 md:px-8 py-6 pb-32 space-y-4 md:space-y-5">
        {newsItems.length === 0 ? (
          <div className="text-center py-12 text-white/70">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nu există știri disponibile</p>
          </div>
        ) : (
          newsItems.map((item) => {
            const userReaction = getUserReaction(item)
            const reactionEmojis = ['👏', '👍', '❤️', '🍾', '🤩'] // Applause, Like, Heart, Champagne, Starstruck
            
            return (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3.5 md:p-4 hover:border-white/30 hover:bg-white/15 transition-all shadow-lg relative"
                style={{
                  transform: 'scale(0.9)',
                  transformOrigin: 'center'
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Agent Avatar */}
                  <div className="flex-shrink-0">
                    {item.agentAvatar ? (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-md">
                        <Image
                          src={item.agentAvatar}
                          alt={item.agentName}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md">
                        {item.agentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 pr-2">
                        {/* Notification text - Two lines */}
                        <div className="text-white font-bold text-sm md:text-base mb-2 leading-snug">
                          <div className="flex items-center gap-1">
                            <span>{item.transactionType || 'Vanzare'}:</span>
                            <span className="text-sky-300">
                              €{item.transactionValue.toLocaleString('ro-RO')}
                            </span>
                          </div>
                          <div className="mt-0.5">
                            <span className="text-white/90">Comision: </span>
                            <span className="text-sky-300">
                              €{item.commission.toLocaleString('ro-RO')}
                            </span>
                          </div>
                        </div>

                        {/* Reactions Display */}
                        {Object.keys(item.reactionCounts).length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {Object.entries(item.reactionCounts).map(([emoji, count]) => {
                              // Get agents who reacted with this emoji
                              const agentsWithReaction = item.reactions
                                .filter(r => r.emoji === emoji)
                                .map(r => r.agentName)
                              
                              return (
                                <div
                                  key={emoji}
                                  className="relative group"
                                >
                                  <button
                                    onClick={() => {
                                      // If user has this reaction, remove it
                                      if (userReaction === emoji) {
                                        handleReaction(item.id, emoji)
                                      }
                                    }}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${
                                      userReaction === emoji
                                        ? 'bg-white/25 border border-white/40 hover:bg-white/30'
                                        : 'bg-white/15 border border-white/25 hover:bg-white/20'
                                    }`}
                                  >
                                    <span className="text-lg">{emoji}</span>
                                    {count > 1 && (
                                      <span className="text-white/90 font-semibold text-xs">{count}</span>
                                    )}
                                  </button>
                                  
                                  {/* Tooltip showing agents who reacted */}
                                  {agentsWithReaction.length > 0 && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                      <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg border border-white/20 shadow-xl whitespace-nowrap">
                                        <div className="font-semibold mb-1 text-center">{emoji} {count}</div>
                                        <div className="space-y-0.5">
                                          {agentsWithReaction.map((agentName, idx) => (
                                            <div key={idx} className="text-white/80">
                                              {agentName}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Tooltip arrow */}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Reaction Button */}
                      <div className="relative flex-shrink-0">
                        <button
                          onMouseDown={() => handleLongPressStart(item.id)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(item.id)}
                          onTouchEnd={handleLongPressEnd}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                            userReaction
                              ? 'text-white/90' 
                              : 'text-white/40 hover:text-white/60'
                          } hover:bg-white/10 active:bg-white/15`}
                        >
                          <div className="relative">
                            {userReaction ? (
                              <span className="text-2xl md:text-3xl">{userReaction}</span>
                            ) : (
                              <SmilePlus className="h-5 w-5 md:h-6 md:w-6" />
                            )}
                            {longPressItemId === item.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1.2 }}
                                className="absolute inset-0 bg-white/20 rounded-full"
                              />
                            )}
                          </div>
                        </button>

                        {/* Reaction Picker */}
                        <AnimatePresence>
                          {showReactionPicker === item.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowReactionPicker(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="absolute bottom-full right-0 mb-2 bg-slate-800/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-2 z-50 flex gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {reactionEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(item.id, emoji)}
                                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-2xl md:text-3xl hover:scale-125 active:scale-110 transition-transform rounded-lg hover:bg-white/10"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

