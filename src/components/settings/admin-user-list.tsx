'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export function AdminUserList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'artifacts/docuras-da-fran-default/users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserData[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as UserData);
      });
      // Sort in memory (newest first)
      usersData.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(firestore, 'artifacts/docuras-da-fran-default/users', userId), {
        role: newRole
      });
      toast({
        title: 'Permissão atualizada',
        description: 'O nível de acesso foi alterado com sucesso.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar a permissão do usuário.',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</div>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nível de Acesso</TableHead>
            <TableHead>Data de Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                {user.role === 'admin' ? (
                  <Badge variant="default" className="bg-primary/90 text-primary-foreground">Administrador</Badge>
                ) : (
                  <Badge variant="secondary">Funcionário</Badge>
                )}
              </TableCell>
              <TableCell>
                {user.createdAt
                  ? format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : '-'}
              </TableCell>
              <TableCell className="text-right">
                <Select
                  value={user.role}
                  onValueChange={(value: 'admin' | 'user') => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-[160px] ml-auto">
                    <SelectValue placeholder="Alterar Permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
