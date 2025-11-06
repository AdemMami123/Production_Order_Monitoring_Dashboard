import api from './api';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  created_at: string;
  updated_at: string;
}

interface GetAllUsersResponse {
  success: boolean;
  data: User[];
  count: number;
}

interface GetUserResponse {
  success: boolean;
  data: User;
}

class UserService {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<GetAllUsersResponse>('/users');
    return response.data.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await api.get<GetUserResponse>(`/users/${id}`);
    return response.data.data;
  }

  async getAssignableUsers(): Promise<User[]> {
    const users = await this.getAllUsers();
    // Filter to only workers and managers (assignable roles)
    return users.filter(user => user.role === 'worker' || user.role === 'manager');
  }
}

const userService = new UserService();
export default userService;
