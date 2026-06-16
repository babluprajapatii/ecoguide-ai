import { Trophy, Award } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  name: string;
  location: string;
  points: number;
  badgesCount: number;
  league: string;
  badgeColorClass: string;
  isCurrentUser?: boolean;
}

const leaderboardData: LeaderboardUser[] = [
  { rank: 1, name: 'Sophia Martinez', location: 'Portland, OR', points: 1240, badgesCount: 18, league: 'Platinum', badgeColorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { rank: 2, name: 'Liam Patel', location: 'Austin, TX', points: 1190, badgesCount: 15, league: 'Platinum', badgeColorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { rank: 3, name: 'Emma Green', location: 'Seattle, WA', points: 980, badgesCount: 12, league: 'Gold', badgeColorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { rank: 4, name: 'Noah Davis', location: 'Denver, CO', points: 890, badgesCount: 11, league: 'Gold', badgeColorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { rank: 5, name: 'Alex River (You)', location: 'San Francisco, CA', points: 850, badgesCount: 9, league: 'Gold', badgeColorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20', isCurrentUser: true },
];

export function CommunityLeaderboard() {
  return (
    <div className="mt-16 max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 mb-4">
          <Trophy className="text-purple-400 w-4 h-4" />
          <span className="text-xs font-semibold text-purple-300 tracking-wider uppercase">Community Leaderboard</span>
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">Compete in Sustainability Leagues</h3>
        <p className="text-stone-400 text-sm font-light max-w-md mx-auto">
          Earn points for carbon-offset actions, complete weekly challenges, and watch your ranking rise.
        </p>
      </div>

      {/* Leaderboard Table Container */}
      <div className="glass-card rounded-2xl overflow-hidden border border-eco-500/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-eco-500/10 bg-dark-800/40 text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-16">Rank</th>
                <th className="py-4 px-6">Green Hero</th>
                <th className="py-4 px-6">Impact Points</th>
                <th className="py-4 px-6 text-center">Badges</th>
                <th className="py-4 px-6">League</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user) => (
                <tr
                  key={user.rank}
                  className={`border-b border-eco-500/5 transition-colors duration-200 ${
                    user.isCurrentUser ? 'bg-eco-500/10 hover:bg-eco-500/15' : 'hover:bg-dark-600/30'
                  }`}
                >
                  <td className="py-4 px-6 text-center font-serif font-semibold text-sm">
                    {user.rank === 1 ? (
                      <span className="text-amber-400 font-bold" aria-label="First Place">🥇</span>
                    ) : user.rank === 2 ? (
                      <span className="text-stone-300 font-bold" aria-label="Second Place">🥈</span>
                    ) : user.rank === 3 ? (
                      <span className="text-amber-600 font-bold" aria-label="Third Place">🥉</span>
                    ) : (
                      <span className="text-stone-400">{user.rank}</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className={`text-sm font-medium ${user.isCurrentUser ? 'text-eco-400' : 'text-white'}`}>
                        {user.name}
                      </p>
                      <p className="text-stone-500 text-xs font-light">{user.location}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-semibold text-white">{user.points} pts</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-eco-400 bg-eco-500/5 border border-eco-500/15 px-2.5 py-1 rounded-full">
                      <Award className="w-3.5 h-3.5" />
                      {user.badgesCount}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${user.badgeColorClass}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {user.league}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-center text-stone-500 text-xs font-light mt-4">
        Leagues reset every Sunday at midnight. Join the fun and optimize today!
      </p>
    </div>
  );
}
