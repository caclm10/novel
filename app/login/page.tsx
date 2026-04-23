"use client";

import { PenTool, Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/magic-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim tautan");
      }

      setIsSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8">
          <PenTool size={32} />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Digital Book-Binder
        </h1>
        
        <p className="text-muted-foreground text-lg">
          A minimalist distraction-free space for your stories. 
          Write anywhere, sync everywhere.
        </p>

        <div className="pt-6">
          {isSent ? (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Periksa Email Anda</h3>
              <p className="text-muted-foreground">
                Tautan masuk telah dikirim ke <strong>{email}</strong>. Klik tautan tersebut untuk masuk ke dalam aplikasi.
              </p>
              <button 
                onClick={() => setIsSent(false)} 
                className="text-sm text-primary hover:underline mt-6"
              >
                Kirim ulang atau gunakan email lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan alamat email Anda"
                  required
                  className="w-full px-6 py-4 bg-muted/50 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-lg placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full px-8 py-4 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLoading ? "Mengirim Tautan..." : (
                  <>Lanjutkan dengan Email <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
