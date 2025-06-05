
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { CompetitionManagement } from '@/components/CompetitionManagement';
import { ClubManagement } from '@/components/ClubManagement';
import { LeagueView } from '@/components/LeagueView';
import { UserManagement } from '@/components/UserManagement';
import type { Competition, User, UserRole } from '../../server/src/schema';

function App() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);

  const loadCompetitions = useCallback(async () => {
    try {
      const result = await trpc.getCompetitions.query();
      setCompetitions(result);
    } catch (error) {
      console.error('Failed to load competitions:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    loadCompetitions();
    loadUsers();
  }, [loadCompetitions, loadUsers]);

  const handleUserLogin = (user: User) => {
    setCurrentUser(user);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'competition_organizer':
        return 'bg-blue-100 text-blue-800';
      case 'club_manager':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏒 Roller Hockey League Manager
          </h1>
          <p className="text-lg text-gray-600">
            Complete competition management system for roller hockey leagues
          </p>
        </div>

        {/* User Selection for Demo */}
        {!currentUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select User Role (Demo Login)</CardTitle>
              <CardDescription>
                Choose a user role to access different parts of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {users.map((user: User) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="p-4 h-auto flex flex-col items-center gap-2"
                    onClick={() => handleUserLogin(user)}
                  >
                    <Badge className={getRoleColor(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="font-medium">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-sm text-gray-500">{user.email}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {currentUser ? (
          <div>
            {/* Current User Info */}
            <Card className="mb-6">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Badge className={getRoleColor(currentUser.role)}>
                    {currentUser.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="font-medium">
                    Welcome, {currentUser.first_name} {currentUser.last_name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentUser(null)}
                >
                  Switch User
                </Button>
              </CardContent>
            </Card>

            {/* Role-based Navigation */}
            <Tabs defaultValue="competitions" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="competitions">🏆 Competitions</TabsTrigger>
                {(currentUser.role === 'admin' || currentUser.role === 'competition_organizer') && (
                  <TabsTrigger value="management">⚙️ Management</TabsTrigger>
                )}
                {(currentUser.role === 'admin' || currentUser.role === 'club_manager') && (
                  <TabsTrigger value="clubs">🏠 Clubs</TabsTrigger>
                )}
                {currentUser.role === 'admin' && (
                  <TabsTrigger value="users">👥 Users</TabsTrigger>
                )}
              </TabsList>

              {/* Public Competitions View */}
              <TabsContent value="competitions" className="space-y-6">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        🏆 Active Competitions
                      </CardTitle>
                      <CardDescription>
                        View schedules, standings, and match results
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {competitions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          No competitions available yet.
                        </p>
                      ) : (
                        <div className="grid gap-4">
                          {competitions
                            .filter((comp: Competition) => comp.is_active)
                            .map((competition: Competition) => (
                              <div
                                key={competition.id}
                                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => setSelectedCompetition(competition)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-lg">
                                      {competition.name}
                                    </h3>
                                    {competition.description && (
                                      <p className="text-gray-600 mt-1">
                                        {competition.description}
                                      </p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                      <span>
                                        Start: {competition.start_date.toLocaleDateString()}
                                      </span>
                                      <span>
                                        End: {competition.end_date.toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant={competition.is_active ? 'default' : 'secondary'}>
                                    {competition.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedCompetition && (
                    <LeagueView
                      competition={selectedCompetition}
                      currentUser={currentUser}
                      onBack={() => setSelectedCompetition(null)}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Competition Management (Admin/Organizer) */}
              {(currentUser.role === 'admin' || currentUser.role === 'competition_organizer') && (
                <TabsContent value="management">
                  <CompetitionManagement
                    currentUser={currentUser}
                    competitions={competitions}
                    onCompetitionUpdate={loadCompetitions}
                  />
                </TabsContent>
              )}

              {/* Club Management (Admin/Club Manager) */}
              {(currentUser.role === 'admin' || currentUser.role === 'club_manager') && (
                <TabsContent value="clubs">
                  <ClubManagement
                    currentUser={currentUser}
                    competitions={competitions}
                  />
                </TabsContent>
              )}

              {/* User Management (Admin only) */}
              {currentUser.role === 'admin' && (
                <TabsContent value="users">
                  <UserManagement
                    users={users}
                    onUserUpdate={loadUsers}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        ) : (
          /* Public View */
          <Card>
            <CardHeader>
              <CardTitle className="text-center">🏒 Public Competition View</CardTitle>
              <CardDescription className="text-center">
                View ongoing competitions and league standings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competitions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active competitions at the moment.
                </p>
              ) : (
                <div className="grid gap-4">
                  {competitions
                    .filter((comp: Competition) => comp.is_active)
                    .map((competition: Competition) => (
                      <div
                        key={competition.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {competition.name}
                            </h3>
                            {competition.description && (
                              <p className="text-gray-600 mt-1">
                                {competition.description}
                              </p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>
                                📅 {competition.start_date.toLocaleDateString()} - {competition.end_date.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
