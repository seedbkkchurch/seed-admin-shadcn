import { Link } from '@tanstack/react-router'
import { MailQuestion } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Sign up is closed
          </CardTitle>
          <CardDescription>
            New accounts are created by an administrator. If you need access,
            reach out to your admin and ask them to create an account for you.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center gap-4 text-center'>
          <MailQuestion className='h-10 w-10 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
