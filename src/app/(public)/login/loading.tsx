import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function LoginLoading() {
    return (
        <Card className="w-full shadow-2xl border-0">
            <CardHeader className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-11 w-full" />
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-11 w-full" />
                </div>

                <Skeleton className="h-11 w-full" />
            </CardContent>

            <CardFooter className="flex-col space-y-4">
                <Skeleton className="h-px w-full" />
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                </div>
                <Skeleton className="h-4 w-48" />
            </CardFooter>
        </Card>
    );
}
