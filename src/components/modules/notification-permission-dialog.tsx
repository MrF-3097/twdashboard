'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'

interface NotificationPermissionDialogProps {
  agentId: number
  agentName: string
  onClose?: () => void
}

/**
 * NotificationPermissionDialog
 * Displays a dialog asking the user to enable push notifications
 * Shows on first app load if notifications are not enabled
 */
export const NotificationPermissionDialog = ({
  agentId,
  agentName,
  onClose,
}: NotificationPermissionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications()

  useEffect(() => {
    // Check localStorage to see if we've already asked
    const asked = localStorage.getItem('notification-permission-asked')
    
    if (!asked && permission === 'default' && !isSubscribed && !hasBeenShown) {
      // Show dialog after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true)
        setHasBeenShown(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [permission, isSubscribed, hasBeenShown])

  const handleEnable = async () => {
    const success = await subscribe(agentId, agentName)
    if (success) {
      localStorage.setItem('notification-permission-asked', 'true')
      setIsOpen(false)
      onClose?.()
    }
  }

  const handleLater = () => {
    localStorage.setItem('notification-permission-asked', 'true')
    setIsOpen(false)
    onClose?.()
  }

  if (!isOpen || isSubscribed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleLater}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Închide"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 p-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg"
            >
              <Bell className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-3">
              Activează Notificările
            </h2>

            {/* Description */}
            <p className="text-center text-slate-300 mb-6 leading-relaxed">
              Fii primul care află când se schimbă liderul în clasament! Primești notificări
              instant când un coleg urcă pe primul loc.
            </p>

            {/* Features list */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Actualizări în timp real</span> despre
                  schimbările din clasament
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Fii motivat</span> să rămâi în vârful
                  competiției
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Nu mai pierde nimic</span> din acțiunea
                  echipei
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnable}
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Se activează...' : 'Activează Notificările'}
              </motion.button>
              <button
                onClick={handleLater}
                className="w-full py-3 px-6 text-slate-400 hover:text-white font-medium transition-colors"
              >
                Poate mai târziu
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

