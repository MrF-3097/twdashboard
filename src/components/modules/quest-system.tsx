'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Circle, Users, User, TrendingUp, Zap } from 'lucide-react'

interface Quest {
  id: string
  title: string
  subtitle: string
  completed: boolean
  icon: React.ReactNode
  color: string
}

export const QuestSystem = () => {
  const [individualQuests, setIndividualQuests] = useState<Quest[]>([
    {
      id: 'colaborare',
      title: 'Colaborare',
      subtitle: 'Aduceți 1 colaborare',
      completed: true,
      icon: '🤝',
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: 'vanzare',
      title: 'Vânzare',
      subtitle: 'Încheiați 1 vânzare',
      completed: true,
      icon: '🏠',
      color: 'from-green-400 to-green-600',
    },
    {
      id: 'exclusivitate',
      title: 'Exclusivitate',
      subtitle: 'Obțineți 1 exclusivitate',
      completed: false,
      icon: '⭐',
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      id: 'vizionare',
      title: 'Vizionări',
      subtitle: 'Programați 5 vizionări',
      completed: false,
      icon: '👁️',
      color: 'from-purple-400 to-purple-600',
    },
  ])

  const [groupQuests, setGroupQuests] = useState<Quest[]>([
    {
      id: 'group-vanzari',
      title: 'Vânzări Echipă',
      subtitle: '10 vânzări în echipă',
      completed: true,
      icon: '🏆',
      color: 'from-orange-400 to-orange-600',
    },
    {
      id: 'group-colaborari',
      title: 'Colaborări Echipă',
      subtitle: '20 colaborări în echipă',
      completed: false,
      icon: '🤜🤛',
      color: 'from-pink-400 to-pink-600',
    },
    {
      id: 'group-exclusivitati',
      title: 'Exclusivități Echipă',
      subtitle: '15 exclusivități în echipă',
      completed: false,
      icon: '✨',
      color: 'from-teal-400 to-teal-600',
    },
    {
      id: 'group-target',
      title: 'Target Lunar',
      subtitle: '€100k comision echipă',
      completed: false,
      icon: '💰',
      color: 'from-indigo-400 to-indigo-600',
    },
  ])

  const calculateProgress = (quests: Quest[]) => {
    return quests.filter(q => q.completed).length
  }

  const individualProgress = calculateProgress(individualQuests)
  const groupProgress = calculateProgress(groupQuests)

  const PieChart = ({ completed, total, size = 120 }: { completed: number; total: number; size?: number }) => {
    const percentage = (completed / total) * 100
    const radius = (size / 2) - 8
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-800">{completed}</span>
          <span className="text-xs text-gray-500">din {total}</span>
        </div>
      </div>
    )
  }

  const QuarteredPieChart = ({ completed, total, size = 100 }: { completed: number; total: number; size?: number }) => {
    const radius = (size / 2) - 6
    const center = size / 2
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Draw 4 quarters */}
          {[0, 1, 2, 3].map((quarter) => {
            const isCompleted = quarter < completed
            const startAngle = (quarter * 90) * (Math.PI / 180)
            const endAngle = ((quarter + 1) * 90) * (Math.PI / 180)
            
            const x1 = center + radius * Math.cos(startAngle)
            const y1 = center + radius * Math.sin(startAngle)
            const x2 = center + radius * Math.cos(endAngle)
            const y2 = center + radius * Math.sin(endAngle)
            
            const largeArcFlag = 0
            const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
            
            return (
              <path
                key={quarter}
                d={path}
                fill={isCompleted ? `hsl(${220 - quarter * 30}, 70%, 60%)` : '#f3f4f6'}
                stroke="white"
                strokeWidth="3"
                className="transition-all duration-500"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-gray-800">{completed}/4</span>
        </div>
      </div>
    )
  }

  const toggleQuest = (questId: string, isGroup: boolean) => {
    if (isGroup) {
      setGroupQuests(prev =>
        prev.map(q => q.id === questId ? { ...q, completed: !q.completed } : q)
      )
    } else {
      setIndividualQuests(prev =>
        prev.map(q => q.id === questId ? { ...q, completed: !q.completed } : q)
      )
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 px-3 py-4">
      {/* Individual Targets */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-lg">Target Personal</h3>
              <p className="text-xs text-gray-600">Obiectivele tale</p>
            </div>
          </div>
          <QuarteredPieChart completed={individualProgress} total={4} />
        </div>

        <div className="space-y-2">
          {individualQuests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => toggleQuest(quest.id, false)}
              className="w-full group"
            >
              <div className={`
                flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                ${quest.completed 
                  ? 'bg-white shadow-md' 
                  : 'bg-white/50 hover:bg-white/80'
                }
              `}>
                <div className="text-3xl">{quest.icon}</div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800 text-sm">{quest.title}</p>
                  <p className="text-xs text-gray-500">{quest.subtitle}</p>
                </div>
                {quest.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300 group-hover:text-gray-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Group Targets */}
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-lg">Target Echipă</h3>
              <p className="text-xs text-gray-600">Obiectivele grupului</p>
            </div>
          </div>
          <QuarteredPieChart completed={groupProgress} total={4} />
        </div>

        <div className="space-y-2">
          {groupQuests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => toggleQuest(quest.id, true)}
              className="w-full group"
            >
              <div className={`
                flex items-center gap-3 p-3 rounded-2xl transition-all duration-300
                ${quest.completed 
                  ? 'bg-white shadow-md' 
                  : 'bg-white/50 hover:bg-white/80'
                }
              `}>
                <div className="text-3xl">{quest.icon}</div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800 text-sm">{quest.title}</p>
                  <p className="text-xs text-gray-500">{quest.subtitle}</p>
                </div>
                {quest.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-orange-500" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300 group-hover:text-gray-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}


