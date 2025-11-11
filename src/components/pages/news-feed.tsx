'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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

  // Generate stable random values for vertical lines
  const verticalLines = useMemo(() => {
    return Array.from({ length: 25 }).map((_, index) => {
      // Use index as seed for consistent randomness
      const seed = index * 123.456
      const randomX = (Math.sin(seed) * 10000) % 100
      const randomDelay = Math.abs(Math.sin(seed * 2) * 4)
      const randomDuration = 3 + Math.abs(Math.sin(seed * 3) * 4)
      
      return {
        x: Math.abs(randomX),
        delay: randomDelay,
        duration: randomDuration
      }
    })
  }, [])

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

      {/* Scrolling Excel Tile Rows - Continuous scroll */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{ overflow: 'hidden' }}>
        {[
          // Random positioned Excel-like tile rows that scroll horizontally
          { y: '10%', delay: 0, duration: 20, widths: [80, 120, 90, 110, 100, 95, 115, 85, 105, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '18%', delay: -2, duration: 25, widths: [95, 110, 85, 125, 100, 90, 120, 80, 115, 105, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '28%', delay: -4, duration: 22, widths: [100, 90, 110, 85, 120, 95, 105, 80, 125, 115, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '38%', delay: -1, duration: 18, widths: [85, 115, 95, 105, 100, 90, 120, 80, 110, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '48%', delay: -3, duration: 24, widths: [110, 100, 90, 120, 85, 115, 95, 105, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '58%', delay: -5, duration: 21, widths: [95, 105, 110, 85, 120, 100, 90, 115, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '68%', delay: -2.5, duration: 23, widths: [100, 90, 115, 95, 105, 110, 85, 120, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '78%', delay: -6, duration: 19, widths: [90, 110, 100, 95, 115, 85, 120, 105, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '15%', delay: -1.5, duration: 26, widths: [105, 95, 110, 100, 90, 115, 85, 120, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '35%', delay: -3.5, duration: 20, widths: [110, 100, 90, 115, 95, 105, 85, 120, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '55%', delay: -4.5, duration: 22, widths: [95, 110, 100, 90, 115, 85, 120, 105, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '75%', delay: -0.5, duration: 24, widths: [100, 95, 110, 90, 115, 105, 85, 120, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '5%', delay: -7, duration: 27, widths: [105, 100, 90, 110, 95, 115, 85, 120, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '85%', delay: -2.2, duration: 21, widths: [90, 110, 100, 95, 115, 105, 85, 120, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
          { y: '25%', delay: -5.5, duration: 19, widths: [110, 95, 100, 90, 115, 105, 85, 120, 80, 125, 75, 130, 88, 112, 98, 108, 92, 118, 82, 102] },
        ].map((tile, index) => (
          <div
            key={index}
            className="absolute w-[200%] animate-excel-scroll"
            style={{
              left: '0',
              top: tile.y,
              height: '3px',
              animationDelay: `${tile.delay}s`,
              animationDuration: `${tile.duration}s`,
            }}
          >
            {/* Repeating Excel grid pattern - duplicated for seamless scroll */}
            <div className="flex h-full relative">
              {/* First pattern */}
              {tile.widths.map((width, i) => (
                <div
                  key={`first-${i}`}
                  className="flex-shrink-0 relative"
                  style={{
                    width: `${width}px`,
                    height: '100%',
                    background: 'rgba(253, 224, 71, 0.1)',
                    borderRight: '1px solid rgba(253, 224, 71, 0.25)',
                    marginRight: '1px',
                  }}
                />
              ))}
              {/* Duplicate pattern for seamless loop */}
              {tile.widths.map((width, i) => (
                <div
                  key={`second-${i}`}
                  className="flex-shrink-0 relative"
                  style={{
                    width: `${width}px`,
                    height: '100%',
                    background: 'rgba(253, 224, 71, 0.1)',
                    borderRight: '1px solid rgba(253, 224, 71, 0.25)',
                    marginRight: '1px',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Vertical lines that fade in and out randomly and scroll horizontally */}
        {verticalLines.map((line, index) => (
          <div
            key={`vline-${index}`}
            className="absolute top-0 bottom-0 animate-excel-line-fade-scroll"
            style={{
              left: `${line.x}%`,
              width: '1px',
              background: 'rgba(253, 224, 71, 0.2)',
              animationDelay: `${line.delay}s`,
              animationDuration: `${line.duration * 2}s`, // Longer duration for scrolling
            }}
          />
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
            const reactionEmojis = ['👏', '❤️', '🍾', '🤩'] // Applause, Heart, Champagne, Starstruck
            
            return (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-3.5 md:p-4 hover:border-white/30 hover:bg-white/15 transition-all shadow-lg relative"
                style={{
                  transform: 'scale(0.9)',
                  transformOrigin: 'center',
                  overflow: 'visible'
                }}
                onMouseDown={() => handleLongPressStart(item.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(item.id)}
                onTouchEnd={handleLongPressEnd}
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
                  </div>
                </div>

                {/* Reaction Picker - Attached to card */}
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
                        className="absolute bottom-full right-2 mb-2 bg-slate-800/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-2 z-50 flex gap-1"
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

                {/* Reactions Container - Top-right with overflow, lined horizontally */}
                <div 
                  className="absolute flex flex-row-reverse gap-2 z-10 pointer-events-none"
                  style={{
                    top: '-16px',
                    right: '7px',
                  }}
                >
                  {/* Existing Reactions - Stacked vertically */}
                  {Object.entries(item.reactionCounts).map(([emoji, count]) => {
                    // Get agents who reacted with this emoji
                    const agentsWithReaction = item.reactions
                      .filter(r => r.emoji === emoji)
                      .map(r => r.agentName)
                    
                    return (
                      <motion.div
                        key={emoji}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="relative group flex flex-col items-center pointer-events-auto"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // If user has this reaction, remove it; otherwise add it
                            handleReaction(item.id, emoji)
                          }}
                          className="transition-all hover:scale-110 active:scale-95"
                          style={{
                            width: '27px',
                            height: '27px',
                            background: 'rgba(30, 40, 60, 0.85)',
                            borderRadius: '50%',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            padding: '5px',
                          }}
                        >
                          <span className="text-base">{emoji}</span>
                        </button>
                        
                        {/* Count Badge */}
                        <div 
                          className="text-white font-semibold text-center"
                          style={{
                            fontSize: '10px',
                            marginTop: '2px',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {count}
                        </div>

                        {/* Tooltip showing agents who reacted */}
                        {agentsWithReaction.length > 0 && (
                          <div className="absolute bottom-full right-full mr-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg border border-white/20 shadow-xl whitespace-nowrap">
                              <div className="font-semibold mb-1">{emoji} {count}</div>
                              <div className="space-y-0.5">
                                {agentsWithReaction.map((agentName, idx) => (
                                  <div key={idx} className="text-white/80">
                                    {agentName}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

