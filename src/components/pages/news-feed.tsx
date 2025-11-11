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
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,230,253,0.05),transparent_60%)]" />
      </div>

      {/* Animated Stock Chart Lines - Above background, behind notifications */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{ overflow: 'hidden' }}>
        {[
          // Random positioned chart lines - irregular placement
          { d: "M-50,200 L50,180 L150,220 L250,160 L350,240 L450,140 L550,260 L650,120 L750,280 L850,100 L950,300", x: '5%', y: '15%', delay: 0, duration: 12, width: '30%' },
          { d: "M-30,400 L70,380 L170,420 L270,360 L370,440 L470,340 L570,460 L670,320 L770,480", x: '60%', y: '25%', delay: -2, duration: 15, width: '25%' },
          { d: "M-40,600 L60,580 L160,620 L260,560 L360,640 L460,540 L560,660 L660,520 L760,680", x: '15%', y: '45%', delay: -4, duration: 11, width: '28%' },
          { d: "M-20,300 L80,280 L180,320 L280,260 L380,340 L480,240 L580,360 L680,220 L780,380", x: '70%', y: '35%', delay: -6, duration: 14, width: '22%' },
          { d: "M-60,500 L40,480 L140,520 L240,460 L340,540 L440,440 L540,560 L640,420 L740,580", x: '10%', y: '55%', delay: -1, duration: 13, width: '35%' },
          { d: "M-35,700 L65,680 L165,720 L265,660 L365,740 L465,640 L565,760 L665,620 L765,780", x: '55%', y: '65%', delay: -3, duration: 16, width: '30%' },
          { d: "M-25,150 L75,130 L175,170 L275,110 L375,190 L475,90 L575,210 L675,70 L775,230", x: '80%', y: '10%', delay: -5, duration: 10, width: '20%' },
          { d: "M-45,550 L55,530 L155,570 L255,510 L355,590 L455,490 L555,610 L655,470 L755,630", x: '25%', y: '70%', delay: -7, duration: 17, width: '32%' },
          { d: "M-15,250 L85,230 L185,270 L285,210 L385,290 L485,190 L585,310 L685,170 L785,330", x: '45%', y: '20%', delay: -0.5, duration: 11.5, width: '26%' },
          { d: "M-55,450 L45,430 L145,470 L245,410 L345,490 L445,390 L545,510 L645,370 L745,530", x: '75%', y: '50%', delay: -2.5, duration: 13.5, width: '24%' },
          { d: "M-30,350 L70,330 L170,370 L270,310 L370,390 L470,290 L570,410 L670,270 L770,430", x: '5%', y: '40%', delay: -4.5, duration: 12.5, width: '30%' },
          { d: "M-40,650 L60,630 L160,670 L260,610 L360,690 L460,590 L560,710 L660,570 L760,730", x: '50%', y: '75%', delay: -6.5, duration: 15.5, width: '28%' },
        ].map((line, index) => (
          <svg
            key={index}
            className="absolute animate-stock-chart-random"
            style={{
              left: line.x,
              top: line.y,
              width: line.width,
              height: 'auto',
              animationDelay: `${line.delay}s`,
              animationDuration: `${line.duration}s`,
            }}
            viewBox="0 0 800 100"
            preserveAspectRatio="none"
          >
            <path
              d={line.d}
              fill="none"
              stroke="#FDE047"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </svg>
        ))}
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

