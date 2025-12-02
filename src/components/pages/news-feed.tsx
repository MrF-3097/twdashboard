'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTransactions } from '@/hooks/use-commissions'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'
import { Bell, SmilePlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NewsItem {
  id: string | number
  itemType: 'transaction' | 'welcome'
  agentName: string
  agentAvatar?: string
  // For transaction items
  transactionValue?: number
  commission?: number
  transactionType?: 'Vanzare' | 'Chirie'
  propertyType?: string
  location?: string
  // For welcome items
  welcomeMessage?: string
  timestamp: Date
}

export const NewsFeed = () => {
  const { agentData } = useAuth()
  const { data: transactions } = useTransactions()
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [rebsAgents, setRebsAgents] = useState<any[]>([])
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [selectedReactions, setSelectedReactions] = useState<Record<string, string>>({}) // itemId -> emoji
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  // Fetch REBS users (agents) for avatar data from new /api/users/ endpoint
  useEffect(() => {
    const fetchRebsAgents = async () => {
      try {
        const response = await fetch('/api/agents')
        const result = await response.json()
        if (result.success && result.data) {
          // /api/agents already returns normalized array from /api/users/ with is_agent=true
          const agentsList = Array.isArray(result.data) ? result.data : []
          setRebsAgents(agentsList)
          console.log(`✅ Loaded ${agentsList.length} agents from REBS users API`)
        }
      } catch (err) {
        console.error('Error fetching REBS agents (users):', err)
      }
    }
    fetchRebsAgents()
  }, [])

  // Fetch news items from database AND convert transactions
  useEffect(() => {
    const fetchAllNewsItems = async () => {
      setIsLoading(true)
      try {
        // Fetch news items from database (welcome messages and newer transactions)
        const dbResponse = await fetch('/api/news/items?limit=50')
        const dbResult = dbResponse.ok ? await dbResponse.json() : { success: false, data: [] }
        
        const dbItems: NewsItem[] = dbResult.success && dbResult.data 
          ? dbResult.data.map((item: any) => ({
              id: `db-${item.id}`,
              itemType: item.itemType || 'transaction',
              agentName: item.agentName,
              agentAvatar: item.agentAvatar,
              transactionValue: item.transactionValue,
              commission: item.commission,
              transactionType: item.transactionType,
              propertyType: item.propertyType,
              location: item.location,
              welcomeMessage: item.welcomeMessage,
              timestamp: new Date(item.timestamp),
            }))
          : []

        // Also convert transactions to news items (for backward compatibility)
        let transactionItems: NewsItem[] = []
        if (transactions?.rows) {
          transactionItems = transactions.rows
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
              } else if ((t as any)['Data Tranzactie']) {
                transactionDate = new Date((t as any)['Data Tranzactie'])
              } else if ((t as any).Date) {
                transactionDate = new Date((t as any).Date)
              } else {
                transactionDate = new Date()
              }

              const closedTransactionType = (t as any)['closed_transaction_type'] || t['Tip Tranzactie'] || (t as any)['Transaction Type']
              const isRental = 
                closedTransactionType === 1 || 
                closedTransactionType === '1' ||
                closedTransactionType === 'Chirie' || 
                closedTransactionType === 'Rental' || 
                closedTransactionType === 'Rent' ||
                closedTransactionType === 'Închiriere' ||
                String(closedTransactionType).toLowerCase().includes('chirie') ||
                String(closedTransactionType).toLowerCase().includes('rent')
              
              const transactionType: 'Vanzare' | 'Chirie' = isRental ? 'Chirie' : 'Vanzare'

              return {
                id: `tx-${t.Timestamp || (t as any)['Data Tranzactie'] || Date.now()}-${index}`,
                itemType: 'transaction' as const,
                agentName,
                agentAvatar: rebsAgent?.avatar || rebsAgent?.profile_picture || rebsAgent?.photo,
                transactionValue: valoare,
                commission: Math.round(com),
                transactionType,
                propertyType: (t as any)['Tip Proprietate'] || (t as any)['Property Type'],
                location: (t as any)['Locatie'] || (t as any)['Location'],
                timestamp: transactionDate
              }
            })
        }

        // Combine both sources and deduplicate by timestamp and agent
        const allItems = [...dbItems, ...transactionItems]
        const uniqueItems = allItems
          .filter((item, index, self) => 
            index === self.findIndex((i) => 
              i.agentName === item.agentName && 
              i.timestamp.getTime() === item.timestamp.getTime() &&
              (item.itemType === 'welcome' || 
               (item.transactionValue === i.transactionValue && item.commission === i.commission))
            )
          )
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 50) // Limit to 50 most recent

        setNewsItems(uniqueItems)
        console.log(`✅ Loaded ${uniqueItems.length} news items (${dbItems.length} from DB, ${transactionItems.length} from transactions)`)
      } catch (err) {
        console.error('Error fetching news items:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllNewsItems()
  }, [transactions?.rows, rebsAgents])


  // Note: News items are now fetched from the database API instead of converting transactions
  // This allows us to include both transaction news and welcome messages

  // Handle long press to show reaction picker
  const handleLongPressStart = (itemId: string) => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(itemId)
    }, 500) // 500ms long press
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = async (itemId: string, emoji: string) => {
    setSelectedReactions(prev => ({
      ...prev,
      [itemId]: emoji
    }))
    setShowReactionPicker(null)

    // Save reaction to server
    if (agentData?.name) {
      try {
        await fetch('/api/news/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId,
            agentName: agentData.name,
            emoji,
            action: 'add',
          }),
        })
      } catch (err) {
        console.error('Error saving reaction:', err)
      }
    }
  }

  // Handle reaction removal
  const handleRemoveReaction = async (itemId: string) => {
    setSelectedReactions(prev => {
      const newReactions = { ...prev }
      delete newReactions[itemId]
      return newReactions
    })

    // Remove reaction from server
    if (agentData?.name) {
      try {
        await fetch('/api/news/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId,
            agentName: agentData.name,
            emoji: selectedReactions[itemId],
            action: 'remove',
          }),
        })
      } catch (err) {
        console.error('Error removing reaction:', err)
      }
    }
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
      <div className="relative z-10 px-4 md:px-8 py-6 pb-32">
        {isLoading ? (
          <div className="text-center py-12 text-white/70">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p>Se încarcă știrile...</p>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-12 text-white/70">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nu există știri disponibile</p>
          </div>
        ) : (
          <div className="grid gap-5 md:gap-6 xl:gap-7 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
            {newsItems.map((item, index) => {
            // Different emojis for welcome vs transaction items
            const reactionEmojis = item.itemType === 'welcome' 
              ? ['🤝', '👑', '❤️', '👏', '🎉'] // Handshake for welcome, then others
              : ['👑', '❤️', '💰', '👏', '🤩'] // Crown, Heart, Moneybag, Clapping, Starstruck
            const selectedEmoji = selectedReactions[String(item.id)]
            const hasReaction = !!selectedEmoji
            
            return (
              <div
                key={item.id}
                className="relative flex h-full flex-col justify-between rounded-3xl border border-white/20 bg-white/10 px-5 py-6 shadow-[0_25px_45px_rgba(2,6,23,0.35)] backdrop-blur-2xl transition-all hover:border-white/40 hover:bg-white/15"
                onMouseDown={() => handleLongPressStart(String(item.id))}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(String(item.id))}
                onTouchEnd={handleLongPressEnd}
              >
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-white/40">
                        {item.itemType === 'welcome' ? 'Bun venit!' : 'Felicitări agentului'}
                      </span>
                    </div>
                    
                    {/* Top Right - Add Reaction Button or Reactions Display */}
                    <div className="absolute -top-4 right-4 flex items-center gap-1.5 z-10">
                      {hasReaction ? (
                        // Show reaction
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveReaction(String(item.id))
                          }}
                          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur-md border-2 border-white/30 shadow-xl cursor-pointer hover:scale-110 transition-transform"
                        >
                          <span className="text-xl">{selectedEmoji}</span>
                        </motion.div>
                      ) : (
                        // Show add reaction button
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowReactionPicker(String(item.id))
                          }}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/60 backdrop-blur-md border-2 border-white/20 hover:border-white/40 hover:bg-slate-800/80 transition-all shadow-lg"
                        >
                          <SmilePlus className="w-5 h-5 text-white/50" />
                        </button>
                      )}
                    </div>
                  </div>

                  {item.itemType === 'welcome' ? (
                    // Welcome message card
                    <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-sky-900/40 to-blue-900/40 p-6 text-center">
                      <div className="text-4xl mb-3">🎉</div>
                      <div className="text-lg md:text-xl font-bold text-white mb-2">
                        {item.welcomeMessage || `Bun venit la Tower Imob, ${item.agentName}!`}
                      </div>
                      <div className="text-sm text-white/70 mt-2">
                        Îți dorim mult succes în noua ta carieră!
                      </div>
                    </div>
                  ) : (
                    // Transaction card
                    <div className="rounded-2xl border border-white/15 bg-slate-900/40 p-4 text-center">
                      <div className={`text-[12px] uppercase tracking-[0.5em] font-semibold ${
                        item.transactionType === 'Chirie' ? 'text-emerald-300' : 'text-white/60'
                      }`}>
                        {(item.transactionType || 'Vanzare').toUpperCase()}
                      </div>
                      <div className="mt-3 text-3xl md:text-4xl font-black text-white">
                        €{(item.transactionValue || 0).toLocaleString('ro-RO')}
                        {item.transactionType === 'Chirie' && (
                          <span className="text-base text-white/60 ml-1">/lună</span>
                        )}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-sky-200">
                        Comision €{(item.commission || 0).toLocaleString('ro-RO')}
                      </div>
                      {item.location && (
                        <div className="mt-1 text-xs text-white/50">
                          {item.location}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-2 text-center">
                    {item.agentAvatar ? (
                      <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/40 shadow-xl">
                        <Image
                          src={item.agentAvatar}
                          alt={item.agentName}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-xl font-semibold text-white shadow-xl">
                        {item.agentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{item.agentName}</span>
                      <span className="text-xs text-white/50">{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Reaction Picker - Centered in card */}
                <AnimatePresence>
                  {showReactionPicker === String(item.id) && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowReactionPicker(null)}
                      />
                      <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                      <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          className="bg-slate-800/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-3 flex gap-2 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {reactionEmojis.map((emoji) => (
                          <button
                            key={emoji}
                              onClick={() => handleEmojiSelect(String(item.id), emoji)}
                              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-3xl md:text-4xl hover:scale-125 active:scale-110 transition-transform rounded-xl hover:bg-white/10"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                      </div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

