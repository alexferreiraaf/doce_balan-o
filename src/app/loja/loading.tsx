import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-32 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
