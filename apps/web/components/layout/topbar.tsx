"use client";

import { useState } from "react";
import { Bell, ChevronDown, LogOut, Settings, User, Menu, X } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

export function TopBar({ onMenuToggle, menuOpen }: TopBarProps) {
  const { workspace } = useWorkspace();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-slate-700 bg-slate-900/30 backdrop-blur-sm shrink-0">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle navigation"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Workspace switcher */}
      <div className="hidden lg:flex items-center">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-transparent hover:border-slate-600">
          <div className="w-5 h-5 rounded bg-sky-500/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-sky-400">
              {workspace?.name.slice(0, 1).toUpperCase() ?? "W"}
            </span>
          </div>
          <span className="font-medium">{workspace?.name ?? "Loading..."}</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 lg:flex-none" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <ChevronDown className={cn("w-3 h-3 transition-transform", userMenuOpen && "rotate-180")} />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-20 py-1 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">Your Account</p>
                  <p className="text-xs text-slate-400">user@example.com</p>
                </div>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
