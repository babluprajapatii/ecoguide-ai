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
  {
    rank: 1,
    name: 'Sophia Martinez',
    location: 'Portland, OR',
    points: 1240,
    badgesCount: 18,
    league: 'Platinum',
    badgeColorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    rank: 2,
    name: 'Liam Patel',
    location: 'Austin, TX',
    points: 1190,
    badgesCount: 15,
    league: 'Platinum',
    badgeColorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    rank: 3,
    name: 'Emma Green',
    location: 'Seattle, WA',
    points: 980,
    badgesCount: 12,
    league: 'Gold',
    badgeColorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    rank: 4,
    name: 'Noah Davis',
    location: 'Denver, CO',
    points: 890,
    badgesCount: 11,
    league: 'Gold',
    badgeColorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    rank: 5,
    name: 'Alex River (You)',
    location: 'San Francisco, CA',
    points: 850,
    badgesCount: 9,
    league: 'Gold',
    badgeColorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    isCurrentUser: true,
  },
];

export function CommunityLeaderboard() {
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      {/* Title */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1.5">
          <Trophy className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Community Leaderboard
          </span>
        </div>
        <h3 className="mb-2 font-serif text-2xl text-white md:text-3xl">
          Compete in Sustainability Leagues
        </h3>
        <p className="mx-auto max-w-md text-sm font-light text-stone-400">
          Earn points for carbon-offset actions, complete weekly challenges, and watch your ranking
          rise.
        </p>
      </div>

      {/* Leaderboard Table Container */}
      <div className="glass-card overflow-hidden rounded-2xl border border-eco-500/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-eco-500/10 bg-dark-800/40 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="w-16 px-6 py-4 text-center">Rank</th>
                <th className="px-6 py-4">Green Hero</th>
                <th className="px-6 py-4">Impact Points</th>
                <th className="px-6 py-4 text-center">Badges</th>
                <th className="px-6 py-4">League</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user) => (
                <tr
                  key={user.rank}
                  className={`border-b border-eco-500/5 transition-colors duration-200 ${
                    user.isCurrentUser
                      ? 'bg-eco-500/10 hover:bg-eco-500/15'
                      : 'hover:bg-dark-600/30'
                  }`}
                >
                  <td className="px-6 py-4 text-center font-serif text-sm font-semibold">
                    {user.rank === 1 ? (
                      <span className="font-bold text-amber-400" aria-label="First Place">
                        🥇
                      </span>
                    ) : user.rank === 2 ? (
                      <span className="font-bold text-stone-300" aria-label="Second Place">
                        🥈
                      </span>
                    ) : user.rank === 3 ? (
                      <span className="font-bold text-amber-600" aria-label="Third Place">
                        🥉
                      </span>
                    ) : (
                      <span className="text-stone-400">{user.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p
                        className={`text-sm font-medium ${user.isCurrentUser ? 'text-eco-400' : 'text-white'}`}
                      >
                        {user.name}
                      </p>
                      <p className="text-xs font-light text-stone-500">{user.location}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-white">{user.points} pts</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-eco-500/15 bg-eco-500/5 px-2.5 py-1 text-xs font-semibold text-eco-400">
                      <Award className="h-3.5 w-3.5" />
                      {user.badgesCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${user.badgeColorClass}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {user.league}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-4 text-center text-xs font-light text-stone-500">
        Leagues reset every Sunday at midnight. Join the fun and optimize today!
      </p>
    </div>
  );
}
