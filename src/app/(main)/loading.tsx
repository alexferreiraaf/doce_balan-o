import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-2/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-2/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-2/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-3/4" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className='w-1/2 space-y-2'><Skeleton className="h-5 w-full" /><Skeleton className="h-3 w-1/2" /></div>
            <Skeleton className="h-6 w-1/4" />
          </div>
           <div className="flex justify-between items-center">
            <div className='w-1/2 space-y-2'><Skeleton className="h-5 w-full" /><Skeleton className="h-3 w-1/2" /></div>
            <Skeleton className="h-6 w-1/4" />
          </div>
           <div className="flex justify-between items-center">
            <div className='w-1/2 space-y-2'><Skeleton className="h-5 w-full" /><Skeleton className="h-3 w-1/2" /></div>
            <Skeleton className="h-6 w-1/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
