import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Headphones, Volume2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LogOut } from 'lucide-react';
import { useAudioEngine } from '@/lib/useAudioEngine';
import StatusIndicator from '@/components/audio/StatusIndicator';
import ChannelCard from '@/components/audio/ChannelCard';
import ControlBar from '@/components/audio/ControlBar';
import SessionInfo from '@/components/audio/SessionInfo';
import AudioVisualizer from '@/components/audio/AudioVisualizer';
import TestPanel from '@/components/audio/TestPanel';
import TrialBanner from '@/components/TrialBanner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user && !user.onboarding_complete) {
        navigate('/onboarding');
      }
    });
  }, []);

  const {
    status,
    error,
    audioLevel,
    frequencyData,
    suppressionLevel,
    start,
    stop,
    pause,
    resume,
    changeSuppressionLevel,
    changeGain
  } = useAudioEngine();

  const [sessionStart, setSessionStart] = useState(null);
  const sessionStartRef = useRef(null);
  const [agentGain, setAgentGain] = useState(1.0);
  const [customerGain, setCustomerGain] = useState(1.0);
  const [customerSuppression, setCustomerSuppression] = useState(70);

  const isActive = status === 'active';

  const handleStart = useCallback(async () => {
    await start();
    const now = Date.now();
    setSessionStart(now);
    sessionStartRef.current = now;
    // Update last_active_date on the user
    base44.auth.me().then(user => {
      if (user) base44.auth.updateMe({ last_active_date: new Date().toISOString() });
    });
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    // Log the session
    if (sessionStartRef.current) {
      const durationMs = Date.now() - sessionStartRef.current;
      const durationMinutes = durationMs / 60000;
      base44.auth.me().then(user => {
        if (user) {
          base44.entities.SessionLog.create({
            user_id: user.id,
            user_email: user.email,
            company_id: user.company_id || '',
            company_name: user.company_name || '',
            domain: user.domain || (user.email ? user.email.split('@')[1] : ''),
            session_start: new Date(sessionStartRef.current).toISOString(),
            session_end: new Date().toISOString(),
            duration_minutes: Math.round(durationMinutes * 10) / 10,
            suppression_level: suppressionLevel
          });
          base44.auth.updateMe({ last_active_date: new Date().toISOString() });
        }
      });
      sessionStartRef.current = null;
    }
    setSessionStart(null);
  }, [stop, suppressionLevel]);

  const handleAgentGainChange = useCallback((v) => {
    setAgentGain(v);
    changeGain(v);
  }, [changeGain]);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      {isActive && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" />
        </div>
      )}

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <img src="https://media.base44.com/images/public/6a0fee336f48ec0bfb9b9279/b787ab024_icon-128.png" alt="ClearVoice" className="w-12 h-12 rounded-2xl object-cover" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  ClearVoice
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Real-time noise suppression for crystal-clear calls
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user && ['admin', 'super_user', 'manager'].includes(user.role) && (
                <div className="flex items-center gap-2 text-sm">
                  <Link to="/reports" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary">Reports</Link>
                  <Link to="/analytics" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary">Analytics</Link>
                  {['admin', 'super_user'].includes(user.role) && (
                    <Link to="/billing" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary">Billing</Link>
                  )}
                  {['admin', 'super_user'].includes(user.role) && (
                    <Link to="/bulk-import" className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary">Import</Link>
                  )}
                </div>
              )}
              <button onClick={() => logout()} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-secondary" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
              <StatusIndicator status={status} />
            </div>
          </div>
        </motion.div>

        <TrialBanner user={user} />

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              <strong>Error:</strong> {error}
              <p className="text-xs mt-1 text-destructive/80">
                Please ensure microphone access is granted in your browser settings.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Visualizer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Audio Output
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Local processing only</span>
            </div>
          </div>
          <AudioVisualizer
            frequencyData={frequencyData}
            isActive={isActive}
            height={140}
          />
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center mb-8"
        >
          <ControlBar
            status={status}
            onStart={handleStart}
            onStop={handleStop}
            onPause={pause}
            onResume={resume}
          />
        </motion.div>

        {/* Channel Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <ChannelCard
            title="Agent (Outbound)"
            icon={Mic}
            isActive={isActive}
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            suppressionLevel={suppressionLevel}
            onSuppressionChange={changeSuppressionLevel}
            gain={agentGain}
            onGainChange={handleAgentGainChange}
          />
          <ChannelCard
            title="Customer (Inbound)"
            icon={Headphones}
            isActive={isActive}
            audioLevel={isActive ? audioLevel * 0.7 : 0}
            frequencyData={isActive ? frequencyData.slice(0, frequencyData.length / 2) : new Uint8Array(0)}
            suppressionLevel={customerSuppression}
            onSuppressionChange={setCustomerSuppression}
            gain={customerGain}
            onGainChange={setCustomerGain}
          />
        </motion.div>

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <SessionInfo status={status} startTime={sessionStart} />
        </motion.div>

        {/* A/B Test Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TestPanel isEngineActive={isActive} />
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-muted-foreground/50">
          <p>All audio processed locally in your browser. No data leaves your device.</p>
        </div>
      </div>
    </div>
  );
}