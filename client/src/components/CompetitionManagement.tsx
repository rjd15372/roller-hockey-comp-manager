
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  Competition, 
  League, 
  User, 
  CreateCompetitionInput, 
  UpdateCompetitionInput,
  CreateLeagueInput 
} from '../../../server/src/schema';

interface CompetitionManagementProps {
  currentUser: User;
  competitions: Competition[];
  onCompetitionUpdate: () => void;
}

export function CompetitionManagement({ 
  currentUser, 
  competitions, 
  onCompetitionUpdate 
}: CompetitionManagementProps) {
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Competition form state
  const [competitionForm, setCompetitionForm] = useState<CreateCompetitionInput>({
    name: '',
    description: null,
    start_date: new Date(),
    end_date: new Date(),
    organizer_id: currentUser.id
  });

  // League form state
  const [leagueForm, setLeagueForm] = useState<CreateLeagueInput>({
    name: '',
    competition_id: 0,
    max_teams: 8
  });

  const loadLeagues = useCallback(async (competitionId: number) => {
    try {
      const result = await trpc.getLeaguesByCompetition.query({ competitionId });
      setLeagues(result);
    } catch (error) {
      console.error('Failed to load leagues:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedCompetition) {
      loadLeagues(selectedCompetition.id);
    }
  }, [selectedCompetition, loadLeagues]);

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createCompetition.mutate(competitionForm);
      onCompetitionUpdate();
      setCompetitionForm({
        name: '',
        description: null,
        start_date: new Date(),
        end_date: new Date(),
        organizer_id: currentUser.id
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create competition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCompetition = async (competition: Competition, updates: Partial<UpdateCompetitionInput>) => {
    setIsLoading(true);
    try {
      const updateData: UpdateCompetitionInput = {
        id: competition.id,
        ...updates
      };
      await trpc.updateCompetition.mutate(updateData);
      onCompetitionUpdate();
    } catch (error) {
      console.error('Failed to update competition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetition) return;
    
    setIsLoading(true);
    try {
      const leagueData: CreateLeagueInput = {
        ...leagueForm,
        competition_id: selectedCompetition.id
      };
      await trpc.createLeague.mutate(leagueData);
      await loadLeagues(selectedCompetition.id);
      setLeagueForm({
        name: '',
        competition_id: selectedCompetition.id,
        max_teams: 8
      });
    } catch (error) {
      console.error('Failed to create league:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSchedule = async (leagueId: number) => {
    setIsLoading(true);
    try {
      await trpc.generateLeagueSchedule.mutate({ leagueId });
      // Refresh leagues to show updated info
      if (selectedCompetition) {
        await loadLeagues(selectedCompetition.id);
      }
    } catch (error) {
      console.error('Failed to generate schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            ⚙️ Competition Management
            <Button onClick={() => setShowCreateForm(true)}>
              Create New Competition
            </Button>
          </CardTitle>
          <CardDescription>
            Manage competitions, leagues, and match schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Competition</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCompetition} className="space-y-4">
                  <Input
                    placeholder="Competition name"
                    value={competitionForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCompetitionForm((prev: CreateCompetitionInput) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    required
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={competitionForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCompetitionForm((prev: CreateCompetitionInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={competitionForm.start_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCompetitionForm((prev: CreateCompetitionInput) => ({
                            ...prev,
                            start_date: new Date(e.target.value)
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={competitionForm.end_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCompetitionForm((prev: CreateCompetitionInput) => ({
                            ...prev,
                            end_date: new Date(e.target.value)
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Competition'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {competitions.map((competition: Competition) => (
              <div
                key={competition.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedCompetition?.id === competition.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCompetition(competition)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{competition.name}</h3>
                    {competition.description && (
                      <p className="text-gray-600 mt-1">{competition.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📅 {competition.start_date.toLocaleDateString()}</span>
                      <span>🏁 {competition.end_date.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={competition.is_active ? 'default' : 'secondary'}>
                      {competition.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={competition.is_active}
                        onCheckedChange={(checked: boolean) =>
                          handleUpdateCompetition(competition, { is_active: checked })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCompetition && (
        <Card>
          <CardHeader>
            <CardTitle>
              🏆 {selectedCompetition.name} - League Management
            </CardTitle>
            <CardDescription>
              Manage leagues within this competition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add League Form */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Add New League</h4>
              <form onSubmit={handleCreateLeague} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="League name"
                    value={leagueForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLeagueForm((prev: CreateLeagueInput) => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Max teams"
                    value={leagueForm.max_teams}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLeagueForm((prev: CreateLeagueInput) => ({
                        ...prev,
                        max_teams: parseInt(e.target.value) || 8
                      }))
                    }
                    min="4"
                    max="20"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add League'}
                </Button>
              </form>
            </div>

            <Separator />

            {/* Existing Leagues */}
            <div className="space-y-4">
              <h4 className="font-medium">Existing Leagues</h4>
              {leagues.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No leagues created yet for this competition.
                </p>
              ) : (
                <div className="grid gap-3">
                  {leagues.map((league: League) => (
                    <div key={league.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium">{league.name}</h5>
                          <p className="text-sm text-gray-600">
                            Max Teams: {league.max_teams}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateSchedule(league.id)}
                            disabled={isLoading}
                          >
                            🗓️ Generate Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
