
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UserRole } from '../../../server/src/schema';

interface UserManagementProps {
  users: User[];
  onUserUpdate: () => void;
}

export function UserManagement({ users, onUserUpdate }: UserManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userForm, setUserForm] = useState<CreateUserInput>({
    email: '',
    password_hash: '',
    first_name: '',
    last_name: '',
    role: 'club_manager'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simple password hashing simulation (in real app, this would be handled securely)
      const userWithHashedPassword: CreateUserInput = {
        ...userForm,
        password_hash: `hashed_${userForm.password_hash}`
      };
      
      await trpc.createUser.mutate(userWithHashedPassword);
      onUserUpdate();
      setUserForm({
        email: '',
        password_hash: '',
        first_name: '',
        last_name: '',
        role: 'club_manager'
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Full system access and user management';
      case 'competition_organizer':
        return 'Manages competitions, leagues, and matches';
      case 'club_manager':
        return 'Manages clubs, teams, and players';
      default:
        return 'Standard user access';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>👥 User Management</CardTitle>
              <CardDescription>
                Manage user accounts and roles in the system
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              Create New User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New User Account</CardTitle>
                <CardDescription>
                  Add a new user to the roller hockey management system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="First name"
                      value={userForm.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUserForm((prev: CreateUserInput) => ({
                          ...prev,
                          first_name: e.target.value
                        }))
                      }
                      required
                    />
                    <Input
                      placeholder="Last name"
                      value={userForm.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUserForm((prev: CreateUserInput) => ({
                          ...prev,
                          last_name: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={userForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserForm((prev: CreateUserInput) => ({
                        ...prev,
                        email: e.target.value
                      }))
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={userForm.password_hash}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserForm((prev: CreateUserInput) => ({
                        ...prev,
                        password_hash: e.target.value
                      }))
                    }
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User Role</label>
                    <Select
                      value={userForm.role || 'club_manager'}
                      onValueChange={(value: UserRole) =>
                        setUserForm((prev: CreateUserInput) => ({
                          ...prev,
                          role: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-800">Admin</Badge>
                            <span>Administrator</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="competition_organizer">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800">Organizer</Badge>
                            <span>Competition Organizer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="club_manager">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">Manager</Badge>
                            <span>Club Manager</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create User'}
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

          {/* Users Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Users</h3>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No users found in the system.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {getRoleDescription(user.role)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.created_at.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" disabled>
                          Edit (Coming Soon)
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Role Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {users.filter((u: User) => u.role === 'admin').length}
                  </div>
                  <div className="text-sm text-gray-500">Administrators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {users.filter((u: User) => u.role === 'competition_organizer').length}
                  </div>
                  <div className="text-sm text-gray-500">Competition Organizers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {users.filter((u: User) => u.role === 'club_manager').length}
                  </div>
                  <div className="text-sm text-gray-500">Club Managers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
