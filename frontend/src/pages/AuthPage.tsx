import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";

type AuthMode = "login" | "register";

export function AuthPage() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");

  // Extract mode from URL or query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get("mode");
    if (modeParam === "register") {
      setMode("register");
    } else {
      setMode("login");
    }
  }, []);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleAuthSuccess = () => {
    // Redirect to intended page or home
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get("redirect") || "/";
    setLocation(redirectTo);
  };

  const switchToRegister = () => {
    setMode("register");
    window.history.pushState(null, "", "/auth?mode=register");
  };

  const switchToLogin = () => {
    setMode("login");
    window.history.pushState(null, "", "/auth?mode=login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {mode === "login" ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )}
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-blue-600">
        <div className="max-w-md text-center text-white">
          <h1 className="text-4xl font-bold mb-6">Kgotla</h1>
          <p className="text-xl mb-8 opacity-90">
            Traditional meeting place for modern voices
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">💬</span>
              </div>
              <div>
                <h3 className="font-semibold">Meaningful Discussions</h3>
                <p className="text-sm opacity-80">
                  Participate in thoughtful conversations that matter
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">🏘️</span>
              </div>
              <div>
                <h3 className="font-semibold">Community Groups</h3>
                <p className="text-sm opacity-80">
                  Join or create groups based on your interests and location
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">⭐</span>
              </div>
              <div>
                <h3 className="font-semibold">Earn Wisdom Points</h3>
                <p className="text-sm opacity-80">
                  Get recognized for helpful contributions to the community
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-sm">🏪</span>
              </div>
              <div>
                <h3 className="font-semibold">Marketplace</h3>
                <p className="text-sm opacity-80">
                  Buy and sell goods within your community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}