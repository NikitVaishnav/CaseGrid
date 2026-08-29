import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';

export default function VerifyBadge({ status, loading }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Verifying Chain...
      </span>
    );
  }

  if (status === 'UNTAMPERED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5" />
        Verified — Untampered
      </span>
    );
  }

  if (status === 'HASH_MISMATCH' || status === 'BLOCK_TAMPERED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 animate-pulse">
        <ShieldAlert className="w-3.5 h-3.5" />
        WARNING — Tampered!
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <AlertTriangle className="w-3.5 h-3.5" />
      Unverified
    </span>
  );
}
