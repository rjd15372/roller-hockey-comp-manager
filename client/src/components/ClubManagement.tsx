
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { 
  Club, 
  Team, 
  Player, 
  Competition,
  League,
  User,
  CreateClubInput,
  CreateTeamInput,
  CreatePlayerInput,
  UpdatePlayerInput
} from '../../../server/src/schema';

interface ClubManagementProps {
  currentUser: User;
  competitions: Competition[];
}

export function ClubManagement({ currentUser, competitions }: ClubManagementProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [clubForm, setClubForm] = useState<CreateClubInput>({
    name: '',
    description: null,
    contact_email: '',
    contact_phone: null,
    manager_id: currentUser.id
  });

  const [teamForm, setTeamForm] = useState<CreateTeamInput>({
    name: '',
    club_id: 0,
    league_id: null
  });

  const [playerForm, setPlayerForm] = useState<CreatePlayerInput>({
    first_name: '',
    last_name: '',
    jersey_number: 1,
    team_id: 0,
    date_of_birth: new Date(),
    position: null
  });

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const loadClubs = useCallback(async () => {
    try {
      if (currentUser.role === 'admin') {
        const result = await trpc.getClubs.query();
        setClubs(result);
      } else {
        const result = await trpc.getClubsByManager.query({ managerId: currentUser.id });
        setClubs(result);
      }
    } catch (error) {
      console.error('Failed to load clubs:', error);
    }
  }, [currentUser]);

  const loadTeams = useCallback(async (clubId: number) => {
    try {
      const result = await trpc.getTeamsByClub.query({ clubId });
      setTeams(result);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  }, []);

  const loadPlayers = useCallback(async (teamId: number) => {
    try {
      const result = await trpc.getPlayersByTeam.query({ teamId });
      setPlayers(result);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  }, []);

  const loadLeagues = useCallback(async (competitionId: number) => {
    try {
      const result = await trpc.getLeaguesByCompetition.query({ competitionId });
      setLeagues(result);
    } catch (error) {
      console.error('Failed to load leagues:', error);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  useEffect(() => {
    if (selectedClub) {
      loadTeams(selectedClub.id);
    }
  }, [selectedClub, loadTeams]);

  useEffect(() => {
    if (selectedTeam) {
      loadPlayers(selectedTeam.id);
    }
  }, [selectedTeam, loadPlayers]);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createClub.mutate(clubForm);
      await loadClubs();
      setClubForm({
        name: '',
        description: null,
        contact_email: '',
        contact_phone: null,
        manager_id: currentUser.id
      });
    } catch (error) {
      console.error('Failed to create club:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    
    setIsLoading(true);
    try {
      const teamData: CreateTeamInput = {
        ...teamForm,
        club_id: selectedClub.id
      };
      await trpc.createTeam.mutate(teamData);
      await loadTeams(selectedClub.id);
      setTeamForm({
        name: '',
        club_id: selectedClub.id,
        league_id: null
      });
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    
    setIsLoading(true);
    try {
      const playerData: CreatePlayerInput = {
        ...playerForm,
        team_id: selectedTeam.id
      };
      await trpc.createPlayer.mutate(playerData);
      await loadPlayers(selectedTeam.id);
      setPlayerForm({
        first_name: '',
        last_name: '',
        jersey_number: 1,
        team_id: selectedTeam.id,
        date_of_birth: new Date(),
        position: null
      });
    } catch (error) {
      console.error('Failed to create player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdatePlayerInput = {
        id: editingPlayer.id,
        first_name: editingPlayer.first_name,
        last_name: editingPlayer.last_name,
        jersey_number: editingPlayer.jersey_number,
        date_of_birth: editingPlayer.date_of_birth,
        position: editingPlayer.position
      };
      await trpc.updatePlayer.mutate(updateData);
      if (selectedTeam) {
        await loadPlayers(selectedTeam.id);
      }
      
      setEditingPlayer(null);
    } catch (error) {
      console.error('Failed to update player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    setIsLoading(true);
    try {
      await trpc.deletePlayer.mutate({ playerId });
      if (selectedTeam) {
        await loadPlayers(selectedTeam.id);
      }
    } catch (error) {
      console.error('Failed to delete player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterTeam = async (teamId: number, leagueId: number) => {
    setIsLoading(true);
    try {
      await trpc.registerTeam.mutate({ team_id: teamId, league_id: leagueId });
      if (selectedClub) {
        await loadTeams(selectedClub.id);
      }
    } catch (error) {
      console.error('Failed to register team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clubs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clubs">🏠 My Clubs</TabsTrigger>
          <TabsTrigger value="teams">⚽ Teams</TabsTrigger>
          <TabsTrigger value="players">👥 Players</TabsTrigger>
        </TabsList>

        {/* Clubs Tab */}
        <TabsContent value="clubs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🏠 Club Management</CardTitle>
              <CardDescription>
                Manage your roller hockey clubs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Club Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Create New Club</h4>
                <form onSubmit={handleCreateClub} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Club name"
                      value={clubForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setClubForm((prev: CreateClubInput) => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Contact email"
                      value={clubForm.contact_email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setClubForm((prev: CreateClubInput) => ({
                          ...prev,
                          contact_email: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <Input
                    placeholder="Contact phone (optional)"
                    value={clubForm.contact_phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setClubForm((prev: CreateClubInput) => ({
                        ...prev,
                        contact_phone: e.target.value || null
                      }))
                    }
                  />
                  <Textarea
                    placeholder="Club description (optional)"
                    value={clubForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setClubForm((prev: CreateClubInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Club'}
                  </Button>
                </form>
              </div>

              <Separator />

              {/* Existing Clubs */}
              <div className="space-y-4">
                <h4 className="font-medium">Your Clubs</h4>
                {clubs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No clubs found. Create your first club above.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {clubs.map((club: Club) => (
                      <div
                        key={club.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedClub?.id === club.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedClub(club)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{club.name}</h5>
                            {club.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {club.description}
                              </p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>📧 {club.contact_email}</span>
                              {club.contact_phone && (
                                <span>📞 {club.contact_phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          {selectedClub ? (
            <Card>
              <CardHeader>
                <CardTitle>⚽ Teams for {selectedClub.name}</CardTitle>
                <CardDescription>
                  Manage teams and league registrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create Team Form */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Create New Team</h4>
                  <form onSubmit={handleCreateTeam} className="space-y-3">
                    <Input
                      placeholder="Team name"
                      value={teamForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTeamForm((prev: CreateTeamInput) => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                      required
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Team'}
                    </Button>
                  </form>
                </div>

                <Separator />

                {/* Existing Teams */}
                <div className="space-y-4">
                  <h4 className="font-medium">Teams</h4>
                  {teams.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No teams created yet for this club.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {teams.map((team: Team) => (
                        <div
                          key={team.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedTeam?.id === team.id
                              ? 'border-green-500 bg-green-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedTeam(team)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">{team.name}</h5>
                              <p className="text-sm text-gray-600">
                                {team.league_id ? 'Registered in League' : 'Not registered'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {!team.league_id && (
                                <Select
                                  onValueChange={(value: string) => {
                                    const [competitionId, leagueId] = value.split('-');
                                    if (leagueId) {
                                      handleRegisterTeam(team.id, parseInt(leagueId));
                                    } else if (competitionId) {
                                      loadLeagues(parseInt(competitionId));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Register for league" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {competitions.map((comp: Competition) => (
                                      <SelectItem
                                        key={comp.id}
                                        value={comp.id.toString()}
                                        onSelect={() => loadLeagues(comp.id)}
                                      >
                                        {comp.name}
                                      </SelectItem>
                                    ))}
                                    {leagues.map((league: League) => (
                                      <SelectItem
                                        key={league.id}
                                        value={`${league.competition_id}-${league.id}`}
                                      >
                                        → {league.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {team.league_id && (
                                <Badge variant="default">Registered</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  Please select a club first to manage its teams.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-6">
          {selectedTeam ? (
            <Card>
              <CardHeader>
                <CardTitle>👥 Players for {selectedTeam.name}</CardTitle>
                <CardDescription>
                  Manage team roster and player information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Player Form */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Add New Player</h4>
                  <form onSubmit={handleCreatePlayer} className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        placeholder="First name"
                        value={playerForm.first_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPlayerForm((prev: CreatePlayerInput) => ({
                            ...prev,
                            first_name: e.target.value
                          }))
                        }
                        required
                      />
                      <Input
                        placeholder="Last name"
                        value={playerForm.last_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPlayerForm((prev: CreatePlayerInput) => ({
                            ...prev,
                            last_name: e.target.value
                          }))
                        }
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Jersey #"
                        value={playerForm.jersey_number}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPlayerForm((prev: CreatePlayerInput) => ({
                            ...prev,
                            jersey_number: parseInt(e.target.value) || 1
                          }))
                        }
                        min="1"
                        max="99"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        value={playerForm.date_of_birth.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPlayerForm((prev: CreatePlayerInput) => ({
                            ...prev,
                            date_of_birth: new Date(e.target.value)
                          }))
                        }
                        required
                      />
                      <Input
                        placeholder="Position (optional)"
                        value={playerForm.position || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPlayerForm((prev: CreatePlayerInput) => ({
                            ...prev,
                            position: e.target.value || null
                          }))
                        }
                      />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Player'}
                    </Button>
                  </form>
                </div>

                <Separator />

                {/* Players List */}
                <div className="space-y-4">
                  <h4 className="font-medium">Team Roster</h4>
                  {players.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No players added yet to this team.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {players.map((player: Player) => (
                        <div key={player.id} className="border rounded-lg p-3">
                          {editingPlayer?.id === player.id ? (
                            <form onSubmit={handleUpdatePlayer} className="space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <Input
                                  value={editingPlayer.first_name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingPlayer((prev: Player | null) =>
                                      prev ? { ...prev, first_name: e.target.value } : null
                                    )
                                  }
                                  required
                                />
                                <Input
                                  value={editingPlayer.last_name}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingPlayer((prev: Player | null) =>
                                      prev ? { ...prev, last_name: e.target.value } : null
                                    )
                                  }
                                  required
                                />
                                <Input
                                  type="number"
                                  value={editingPlayer.jersey_number}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingPlayer((prev: Player | null) =>
                                      prev ? { ...prev, jersey_number: parseInt(e.target.value) || 1 } : null
                                    )
                                  }
                                  min="1"
                                  max="99"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  type="date"
                                  value={editingPlayer.date_of_birth.toISOString().split('T')[0]}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingPlayer((prev: Player | null) =>
                                      prev ? { ...prev, date_of_birth: new Date(e.target.value) } : null
                                    )
                                  }
                                  required
                                />
                                <Input
                                  value={editingPlayer.position || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setEditingPlayer((prev: Player | null) =>
                                      prev ? { ...prev, position: e.target.value || null } : null
                                    )
                                  }
                                  placeholder="Position"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={isLoading}>
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPlayer(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-mono">
                                  #{player.jersey_number}
                                </Badge>
                                <div>
                                  <h5 className="font-medium">
                                    {player.first_name} {player.last_name}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {player.position || 'No position'} • 
                                    Born: {player.date_of_birth.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPlayer(player)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeletePlayer(player.id)}
                                  disabled={isLoading}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  Please select a team first to manage its players.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
