'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import { useProperties } from '@/hooks/use-properties'
import { PropertyCard } from '@/components/modules/properties/property-card'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { useAuth } from '@/hooks/use-auth'

export default function PropertiesPage() {
  const router = useRouter()
  const { agentData, isLoading: authLoading } = useAuth()
  const { properties, isLoading, isError, totalCount } = useProperties()
  
  // Filter properties by logged-in agent
  const agentProperties = React.useMemo(() => {
    // Wait for auth to finish loading before filtering
    if (authLoading || !agentData?.id) {
      return []
    }
    
    console.log('🔍 [PropertiesPage] Filtering properties by agent', {
      agentId: agentData.id,
      agentName: agentData.name,
      totalProperties: properties.length,
    })
    
    const filtered = properties.filter((property: any) => {
      // Handle both property.agent.id and property.agent (if agent is just an ID)
      const propertyAgentId = property.agent?.id || property.agent
      const matches = propertyAgentId === agentData.id
      
      return matches
    })
    
    console.log('✅ [PropertiesPage] Filtered properties', {
      originalCount: properties.length,
      filteredCount: filtered.length,
      agentId: agentData.id,
    })
    
    return filtered
  }, [properties, agentData?.id, authLoading])

  if (typeof window !== 'undefined') {
    console.log('🏠 [PropertiesPage] Component rendered', {
      propertiesCount: properties.length,
      agentPropertiesCount: agentProperties.length,
      agentId: agentData?.id,
      agentName: agentData?.name,
      isLoading,
      isError,
      totalCount,
      pathname: window.location.pathname,
    })
  }

  React.useEffect(() => {
    console.log('🏠 [PropertiesPage] Component mounted/navigated to')
    return () => {
      console.log('🏠 [PropertiesPage] Component unmounting')
    }
  }, [])

  const handleBack = () => {
    console.log('🏠 [PropertiesPage] Back button clicked')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] pb-24 md:pb-0 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Proprietăți Active</h1>
                {!isLoading && agentData?.name && (
                  <p className="text-xs text-slate-400">
                    {agentProperties.length} proprietăți pentru {agentData.name}
                  </p>
                )}
                {!isLoading && !agentData?.name && (
                  <p className="text-xs text-slate-400">
                    {agentProperties.length} proprietăți disponibile
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <main className="container mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
            <p className="text-slate-400">Se încarcă proprietățile...</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-red-400 font-semibold mb-2">Eroare la încărcare</p>
            <p className="text-slate-400 text-sm text-center max-w-sm">
              Nu s-au putut încărca proprietățile. Te rugăm să încerci din nou mai târziu.
            </p>
            <button
              onClick={() => typeof window !== 'undefined' && window.location.reload()}
              className="mt-4 px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
            >
              Reîncarcă
            </button>
          </div>
        )}

        {!isLoading && !isError && agentProperties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-400 font-semibold mb-2">Nu există proprietăți active</p>
            <p className="text-slate-500 text-sm text-center max-w-sm">
              {agentData?.name 
                ? `Nu sunt proprietăți disponibile pentru ${agentData.name} momentan.`
                : 'Nu sunt proprietăți disponibile momentan.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && agentProperties.length > 0 && (
          <>
            {/* Stats Summary - Mobile only */}
            <div className="md:hidden mb-6 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-white">{agentProperties.length}</p>
                  <p className="text-xs text-slate-400">
                    {agentData?.name ? `Proprietăți ${agentData.name}` : 'Proprietăți active'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Properties Grid - Shows ALL active properties for the agent */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentProperties.map((property, index) => {
                console.log(`📋 [PropertiesPage] Rendering property ${index + 1}/${agentProperties.length}:`, {
                  id: property.id,
                  title: property.title || property.name,
                  hasImage: !!(property.resized_images?.[0] || property.full_images?.[0] || property.thumbnail),
                })
                return (
                  <PropertyCard key={property.id} property={property} />
                )
              })}
            </div>
            
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && agentProperties.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-slate-700/50 text-xs text-slate-400">
                <p>📊 Debug: Showing {agentProperties.length} of {properties.length} active properties for {agentData?.name}</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav 
        activeTab="home" 
        onTabChange={(tab) => {
          if (tab === 'home') router.push('/')
          else router.push(`/${tab}`)
        }}
      />
    </div>
  )
}

