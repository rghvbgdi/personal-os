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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-accent shadow-glow mx-auto">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
              <p className="text-sm text-text-secondary mt-1">Start your Personal OS journey</p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-elevated space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full name"
                placeholder="Raghav Bagdi"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-muted hover:text-text-secondary transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                {...register('password')}
              />
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" loading={isSubmitting} className="w-full">
                Create account
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-accent hover:text-accent-hover font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
