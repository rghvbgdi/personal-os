import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants/index.js';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ confirmPassword, ...data }) => {
    try {
      await authRegister(data);
      toast.success('Account created!');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div
      className="relative min-h-dvh bg-background flex flex-col justify-center px-6 overflow-x-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* Animated background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/8 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl"
        />
      </div>

      <div className="relative w-full max-w-sm mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* Logo + heading */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-accent shadow-glow mx-auto"
            >
              <Zap className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">Create account</h1>
              <p className="text-sm text-text-secondary mt-2">Start your Personal OS journey</p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-elevated space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full name"
                autoComplete="name"
                placeholder="Raghav Bagdi"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-muted hover:text-text-secondary transition-colors p-1">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('password')}
              />
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" loading={isSubmitting} className="w-full mt-2">
                Create account
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-accent hover:text-accent-hover font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
