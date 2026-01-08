import { Trophy, TrendingUp, TrendingDown, Medal, Crown, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useState, useEffect } from "react";

export function LeaderboardScreen() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const weeklyLeaderboard = [
    {
      id: "1",
      rank: 1,
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      score: 285,
      clients: 8,
      properties: 12,
      deals: 3,
      movement: "up" as const,
      isCurrentUser: false
    },
    {
      id: "2",
      rank: 2,
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      score: 267,
      clients: 12,
      properties: 18,
      deals: 4,
      movement: "up" as const,
      isCurrentUser: true
    },
    {
      id: "3",
      rank: 3,
      name: "Michael Brown",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      score: 245,
      clients: 10,
      properties: 15,
      deals: 2,
      movement: "down" as const,
      isCurrentUser: false
    },
    {
      id: "4",
      rank: 4,
      name: "Emily Chen",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      score: 228,
      clients: 7,
      properties: 14,
      deals: 2,
      movement: "up" as const,
      isCurrentUser: false
    },
    {
      id: "5",
      rank: 5,
      name: "David Wilson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      score: 215,
      clients: 6,
      properties: 11,
      deals: 2,
      movement: null,
      isCurrentUser: false
    }
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return null;
  };

  const getRankGradient = (rank: number) => {
    if (rank === 1) return "from-yellow-100 to-amber-100 border-yellow-300";
    if (rank === 2) return "from-gray-100 to-slate-100 border-gray-300";
    if (rank === 3) return "from-amber-100 to-orange-100 border-amber-300";
    return "from-white to-white border-border/50";
  };

  return (
    <div className="pb-24 pt-4 px-4">
      {/* Header */}
      <div className={`mb-6 animate-in slide-in-from-top-4 duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">See where you rank</p>
          </div>
        </div>

        {/* Period Toggle */}
        <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-xl">
          <button
            onClick={() => setPeriod("week")}
            className={`flex-1 py-2 rounded-lg text-sm transition-all duration-200 ${
              period === "week"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`flex-1 py-2 rounded-lg text-sm transition-all duration-200 ${
              period === "month"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Podium (Top 3) */}
      <div className={`mb-6 animate-in slide-in-from-top-5 duration-500 delay-100 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-end justify-center gap-3 mb-8">
          {/* 2nd Place */}
          {weeklyLeaderboard[1] && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-2">
                <Avatar className="h-16 w-16 ring-4 ring-gray-300 shadow-lg">
                  <AvatarImage src={weeklyLeaderboard[1].avatar} alt={weeklyLeaderboard[1].name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    {weeklyLeaderboard[1].name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-xs text-white">2</span>
                </div>
              </div>
              <p className="text-xs text-foreground text-center mb-1">{weeklyLeaderboard[1].name.split(' ')[0]}</p>
              <div className="w-full bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-xl border-2 border-b-0 border-gray-300 py-3 px-2">
                <p className="text-lg text-center">{weeklyLeaderboard[1].score}</p>
                <p className="text-xs text-muted-foreground text-center">points</p>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {weeklyLeaderboard[0] && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </div>
                <Avatar className="h-20 w-20 ring-4 ring-yellow-400 shadow-xl">
                  <AvatarImage src={weeklyLeaderboard[0].avatar} alt={weeklyLeaderboard[0].name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl">
                    {weeklyLeaderboard[0].name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-foreground text-center mb-1">{weeklyLeaderboard[0].name.split(' ')[0]}</p>
              <div className="w-full bg-gradient-to-t from-yellow-200 to-yellow-100 rounded-t-xl border-2 border-b-0 border-yellow-400 py-4 px-2">
                <p className="text-xl text-center">{weeklyLeaderboard[0].score}</p>
                <p className="text-xs text-muted-foreground text-center">points</p>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {weeklyLeaderboard[2] && (
            <div className="flex flex-col items-center flex-1">
              <div className="relative mb-2">
                <Avatar className="h-16 w-16 ring-4 ring-amber-600 shadow-lg">
                  <AvatarImage src={weeklyLeaderboard[2].avatar} alt={weeklyLeaderboard[2].name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    {weeklyLeaderboard[2].name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  <span className="text-xs text-white">3</span>
                </div>
              </div>
              <p className="text-xs text-foreground text-center mb-1">{weeklyLeaderboard[2].name.split(' ')[0]}</p>
              <div className="w-full bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-xl border-2 border-b-0 border-amber-600 py-2 px-2">
                <p className="text-lg text-center">{weeklyLeaderboard[2].score}</p>
                <p className="text-xs text-muted-foreground text-center">points</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Rankings */}
      <div className="space-y-3">
        {weeklyLeaderboard.map((agent, index) => {
          const rankIcon = getRankIcon(agent.rank);
          const gradient = getRankGradient(agent.rank);
          
          return (
            <div
              key={agent.id}
              className={`bg-gradient-to-r ${gradient} rounded-2xl border-2 overflow-hidden transition-all duration-300 animate-in slide-in-from-left-4 ${
                agent.isCurrentUser ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                    {rankIcon || (
                      <span className="text-xl text-muted-foreground">
                        {agent.rank}
                      </span>
                    )}
                    {agent.movement && (
                      <div className={`flex items-center gap-0.5 mt-1 ${
                        agent.movement === "up" ? "text-green-600" : "text-red-600"
                      }`}>
                        {agent.movement === "up" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm flex-shrink-0">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-foreground truncate">{agent.name}</h3>
                      {agent.isCurrentUser && (
                        <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{agent.clients} clients</span>
                      <span>•</span>
                      <span>{agent.properties} properties</span>
                      <span>•</span>
                      <span>{agent.deals} deals</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <p className="text-xl text-foreground">{agent.score}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Message */}
      <div className={`mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50 animate-in slide-in-from-bottom-4 duration-500 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-sm text-foreground text-center">
          🎯 <span className="font-medium">Great progress!</span> Add 2 more clients to move up in rankings.
        </p>
      </div>
    </div>
  );
}
