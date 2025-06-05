
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { 
  Competition, 
  League, 
  Match, 
  LeagueStanding, 
  Team,
  User,
  UpdateMatchScoreInput,
  MatchStatus
} from '../../../server/src/schema';

interface LeagueViewProps {
  competition: Competition;
  currentUser: User | null;
  onBack: () => void;
}

export function LeagueView({ competition, currentUser, onBack }: LeagueViewProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchScores, setMatchScores] = useState<{ home_score: number; away_score: number }>({
    home_score: 0,
    away_score: 0
  });

  const loadLeagues = useCallback(async () => {
    try {
      const result = await trpc.getLeaguesByCompetition.query({ 
        competitionId: competition.id 
      });
      setLeagues(result);
      if (result.length > 0) {
        setSelectedLeague(result[0]);
      }
    } catch (error) {
      console.error('Failed to load leagues:', error);
    }
  }, [competition.id]);

  const loadMatches = useCallback(async (leagueId: number) => {
    try {
      const result = await trpc.getMatchesByLeague.query({ leagueId });
      setMatches(result);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  }, []);

  const loadStandings = useCallback(async (leagueId: number) => {
    try {
      const result = await trpc.getLeagueStandings.query({ leagueId });
      setStandings(result);
    } catch (error) {
      console.error('Failed to load standings:', error);
    }
  }, []);

  const loadTeams = useCallback(async (leagueId: number) => {
    try {
      const result = await trpc.getTeamsByLeague.query({ leagueId });
      setTeams(result);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  }, []);

  useEffect(() => {
    loadLeagues();
  }, [loadLeagues]);

  useEffect(() => {
    if (selectedLeague) {
      loadMatches(selectedLeague.id);
      loadStandings(selectedLeague.id);
      loadTeams(selectedLeague.id);
    }
  }, [selectedLeague, loadMatches, loadStandings, loadTeams]);

  const handleUpdateMatchScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    setIsLoading(true);
    try {
      const updateData: UpdateMatchScoreInput = {
        match_id: editingMatch.id,
        home_score: matchScores.home_score,
        away_score: matchScores.away_score
      };
      await trpc.updateMatchScore.mutate(updateData);
      
      if (selectedLeague) {
        await loadMatches(selectedLeague.id);
        await loadStandings(selectedLeague.id);
        await trpc.updateLeagueStandings.mutate({ leagueId: selectedLeague.id });
      }
      
      setEditingMatch(null);
      setMatchScores({ home_score: 0, away_score: 0 });
    } catch (error) {
      console.error('Failed to update match score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchStatusColor = (status: MatchStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamName = (teamId: number) => {
    const team = teams.find((t: Team) => t.id === teamId);
    return team ? team.name : `Team ${teamId}`;
  };

  const canEditMatches = currentUser && 
    (currentUser.role === 'admin' || currentUser.role === 'competition_organizer');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  ← Back
                </Button>
                🏆 {competition.name}
              </CardTitle>
              <CardDescription>
                {competition.description || 'Competition details and league information'}
              </CardDescription>
            </div>
            <Badge variant={competition.is_active ? 'default' : 'secondary'}>
              {competition.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* League Selection */}
      {leagues.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="font-medium">Select League:</span>
              <Select
                value={selectedLeague?.id.toString() || ''}
                onValueChange={(value: string) => {
                  const league = leagues.find((l: League) => l.id === parseInt(value));
                  setSelectedLeague(league || null);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a league" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map((league: League) => (
                    <SelectItem key={league.id} value={league.id.toString()}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLeague ? (
        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches">🏒 Matches</TabsTrigger>
            <TabsTrigger value="standings">📊 Standings</TabsTrigger>
            <TabsTrigger value="teams">⚽ Teams</TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🏒 Match Schedule - {selectedLeague.name}</CardTitle>
                <CardDescription>
                  League matches and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No matches scheduled yet for this league.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match: Match) => (
                      <div key={match.id} className="border rounded-lg p-4">
                        {editingMatch?.id === match.id ? (
                          <form onSubmit={handleUpdateMatchScore} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="font-medium">
                                  {getTeamName(match.home_team_id)}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={matchScores.home_score}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setMatchScores((prev) => ({
                                      ...prev,
                                      home_score: parseInt(e.target.value) || 0
                                    }))
                                  }
                                  className="w-20 text-center"
                                />
                                <span>-</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={matchScores.away_score}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setMatchScores((prev) => ({
                                      ...prev,
                                      away_score: parseInt(e.target.value) || 0
                                    }))
                                  }
                                  className="w-20 text-center"
                                />
                                <span className="font-medium">
                                  {getTeamName(match.away_team_id)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={isLoading}>
                                  Save Score
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMatch(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-sm text-gray-500">
                                  {match.scheduled_date.toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {match.scheduled_date.toLocaleTimeString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 font-medium">
                                <span>{getTeamName(match.home_team_id)}</span>
                                <div className="text-center min-w-[60px]">
                                  {match.status === 'completed' ? (
                                    <span className="text-lg">
                                      {match.home_score} - {match.away_score}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">vs</span>
                                  )}
                                </div>
                                <span>{getTeamName(match.away_team_id)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getMatchStatusColor(match.status)}>
                                {match.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {canEditMatches && match.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMatch(match);
                                    setMatchScores({
                                      home_score: match.home_score || 0,
                                      away_score: match.away_score || 0
                                    });
                                  }}
                                >
                                  Record Score
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>📊 League Standings - {selectedLeague.name}</CardTitle>
                <CardDescription>
                  Current league table and team statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {standings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No standings available yet. Matches need to be played first.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">GP</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">GF</TableHead>
                        <TableHead className="text-center">GA</TableHead>
                        <TableHead className="text-center">GD</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings
                        .sort((a: LeagueStanding, b: LeagueStanding) => b.points - a.points)
                        .map((standing: LeagueStanding, index: number) => (
                          <TableRow key={standing.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {getTeamName(standing.team_id)}
                            </TableCell>
                            <TableCell className="text-center">{standing.games_played}</TableCell>
                            <TableCell className="text-center">{standing.wins}</TableCell>
                            <TableCell className="text-center">{standing.draws}</TableCell>
                            <TableCell className="text-center">{standing.losses}</TableCell>
                            <TableCell className="text-center">{standing.goals_for}</TableCell>
                            <TableCell className="text-center">{standing.goals_against}</TableCell>
                            <TableCell className="text-center">
                              {standing.goals_for - standing.goals_against}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {standing.points}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>⚽ Teams in {selectedLeague.name}</CardTitle>
                <CardDescription>
                  Teams participating in this league
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No teams registered for this league yet.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team: Team) => (
                      <div key={team.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-600">
                          Club ID: {team.club_id}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Registered: {team.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              No leagues found for this competition.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
