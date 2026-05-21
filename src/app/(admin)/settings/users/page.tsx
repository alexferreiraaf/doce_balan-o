import { AdminUserForm } from '@/components/settings/admin-user-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
        <Users className="w-8 h-8" />
        Gerenciamento de Usuários
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Usuário</CardTitle>
          <CardDescription>
            Crie contas para outros administradores ou funcionários acessarem o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserForm />
        </CardContent>
      </Card>
    </div>
  );
}
