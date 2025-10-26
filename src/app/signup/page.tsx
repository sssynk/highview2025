'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await signup(email, password);

    if (result.success) {
      setSuccess(result.message || 'Account created successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setError(result.error || 'Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <div className="mb-8 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="173.202" height="17.94" viewBox="0 0 173.202 17.94" className="h-8 w-auto">
              <g id="Group_8604" data-name="Group 8604" transform="translate(-494.706 -119.476)">
                <path id="Path_9848" data-name="Path 9848" d="M494.706,119.776h2.286v7.745h8.7v-7.745H508v17.381h-2.309v-7.536h-8.7v7.536h-2.286Z" transform="translate(0 -0.02)" fill="#000"></path>
                <path id="Path_9849" data-name="Path 9849" d="M521.731,119.776h2.287v17.381h-2.287Z" transform="translate(-1.801 -0.02)" fill="#000"></path>
                <path id="Path_9850" data-name="Path 9850" d="M541.409,136.752a8.049,8.049,0,0,1-2.707-1.867,8.637,8.637,0,0,1-1.785-2.847,9.753,9.753,0,0,1-.641-3.581,9.9,9.9,0,0,1,.629-3.592,8.565,8.565,0,0,1,1.785-2.847,8.117,8.117,0,0,1,2.707-1.878,8.525,8.525,0,0,1,3.4-.665,7.949,7.949,0,0,1,3.231.63,7.749,7.749,0,0,1,2.426,1.633,6.013,6.013,0,0,1,1.411,2.146l-2.053,1a5,5,0,0,0-1.891-2.4,5.437,5.437,0,0,0-3.125-.887,6.07,6.07,0,0,0-3.231.863,5.94,5.94,0,0,0-2.206,2.4,7.738,7.738,0,0,0-.793,3.592,7.6,7.6,0,0,0,.806,3.57,6.007,6.007,0,0,0,2.216,2.4,6.072,6.072,0,0,0,3.231.863,5.989,5.989,0,0,0,2.859-.677,5.332,5.332,0,0,0,2.029-1.867A5.013,5.013,0,0,0,550.46,130V129.9h-5.668v-1.982h7.977v1.539a8.184,8.184,0,0,1-.629,3.278,7.555,7.555,0,0,1-4.27,4.118,8.407,8.407,0,0,1-3.056.559A8.623,8.623,0,0,1,541.409,136.752Z" transform="translate(-2.771 0)" fill="#000"></path>
                <path id="Path_9851" data-name="Path 9851" d="M565.848,119.776h2.287v7.745h8.7v-7.745h2.31v17.381h-2.31v-7.536h-8.7v7.536h-2.287Z" transform="translate(-4.741 -0.02)" fill="#000"></path>
                <path id="Path_9852" data-name="Path 9852" d="M591.064,119.776h2.449l5.086,14.581,5.063-14.581h2.449l-6.252,17.381h-2.52Z" transform="translate(-6.422 -0.02)" fill="#000"></path>
                <path id="Path_9853" data-name="Path 9853" d="M618.152,119.776h2.286v17.381h-2.286Z" transform="translate(-8.227 -0.02)" fill="#000"></path>
                <path id="Path_9854" data-name="Path 9854" d="M655.93,119.776h2.4l3.8,14.277,3.967-14.277h2.4l3.919,14.232,3.826-14.232h2.4l-4.876,17.381h-2.543l-3.943-14.138-3.944,14.138H660.8Z" transform="translate(-10.745 -0.02)" fill="#000"></path>
                <g id="Group_8603" data-name="Group 8603" transform="translate(624.13 120.913)">
                  <rect id="Rectangle_3852" data-name="Rectangle 3852" width="8.077" height="1.96" transform="translate(3.256 7.099)" fill="#000"></rect>
                  <rect id="Rectangle_3853" data-name="Rectangle 3853" width="11.333" height="1.96" transform="translate(0 14.264)" fill="#000"></rect>
                  <rect id="Rectangle_3854" data-name="Rectangle 3854" width="4.821" height="1.96" transform="translate(6.511)" fill="#000"></rect>
                </g>
              </g>
            </svg>
            <p className="mt-4 text-sm font-medium">Create Account</p>
            <p className="text-xs text-muted-foreground">
              Sign up for Highview
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                className="w-full rounded-md border bg-background px-3 py-2"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-primary hover:underline">
                Login
              </a>
            </p>
          </div>

          <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Note: After signing up, you'll need to wait for an admin to assign you a role before you can access the system.
          </div>
        </div>
      </div>
    </div>
  );
}

