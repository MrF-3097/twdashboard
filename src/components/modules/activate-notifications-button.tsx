'use client'

import { useCallback } from 'react'
import { BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export const ActivateNotificationsButton = () => {
  const { permission, isSubscribed } = usePushNotifications()
  const isEnabled = permission === 'granted' || isSubscribed

  const handleClick = useCallback(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('tower:show-notification-dialog'))
  }, [])

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-center gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
      onClick={handleClick}
      disabled={isEnabled}
    >
      <BellRing className="h-4 w-4" />
      {isEnabled ? 'Notificările sunt active' : 'Activează notificările'}
    </Button>
  )
}































