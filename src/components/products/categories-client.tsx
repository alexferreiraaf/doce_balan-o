'use client';
import Loading from '@/app/(admin)/loading-component';
import { Card, CardContent } from '../ui/card';
import { Tag } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import { AddProductCategoryDialog } from './add-product-category-dialog';
import { DeleteProductCategoryButton } from './delete-product-category-button';

export function CategoriesClient() {
  const { categories, loading } = useProductCategories();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <Tag className="w-8 h-8 mr-3" />
            Categorias de Produtos
        </h1>
        <AddProductCategoryDialog isPrimaryButton />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Nenhuma categoria cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                        {category.name}
                    </TableCell>
                    <TableCell className="text-right">
                        <DeleteProductCategoryButton categoryId={category.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
