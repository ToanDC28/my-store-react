export default interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  enabled: boolean;
  roles: string[];
  permissions: string[];
}
