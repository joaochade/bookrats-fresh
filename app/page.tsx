import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-primary p-4 rounded-2xl">
            <BookOpen size={48} className="text-primary-foreground" />
          </div>
        </div>
        
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold mb-2">
            BookRats
          </h1>
          <p className="text-muted-foreground">
            Track your daily reading with friends
          </p>
        </div>
        
        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/auth/signup">
              Get Started
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/auth/login">
              Log In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}