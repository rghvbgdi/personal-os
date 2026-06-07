import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 35, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent/8 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl"
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
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">Welcome back</h1>
              <p className="text-sm text-text-secondary mt-2">Sign in to your Personal OS</p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-elevated space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-muted hover:text-text-secondary transition-colors p-1">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('password')}
              />
              <Button type="submit" loading={isSubmitting} className="w-full mt-2">
                Sign in
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="text-accent hover:text-accent-hover font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
