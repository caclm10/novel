"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyMagicUrl } from "@/actions/auth";
import { Loader2 } from "lucide-react";

function VerifyContent() {
   const searchParams = useSearchParams();
   const router = useRouter();
   const [isVerifying, setIsVerifying] = useState(false);
   const [errorMessage, setErrorMessage] = useState("");

   const userId = searchParams.get("userId");
   const secret = searchParams.get("secret");

   const handleVerify = async () => {
      if (!userId || !secret) return;
      setIsVerifying(true);
      
      const res = await verifyMagicUrl(userId, secret);
      if (res.success) {
         router.push("/");
      } else {
         setIsVerifying(false);
         setErrorMessage(res.error || "Gagal melakukan verifikasi sesi.");
      }
   };

   return (
      <div className="w-full max-w-md bg-card border border-border/40 shadow-xl rounded-2xl p-8 text-center space-y-6">
         <h1 className="text-2xl font-bold font-heading">Verifikasi Login</h1>
         <p className="text-muted-foreground text-sm">
            Silakan klik tombol di bawah untuk masuk ke akun Anda. Langkah ini diperlukan agar tautan tidak disalahgunakan oleh robot keamanan email Anda.
         </p>
         
         {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium">
               Error: {errorMessage}
            </div>
         )}
         
         <button
            onClick={handleVerify}
            disabled={isVerifying || !userId || !secret}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
         >
            {isVerifying ? (
               <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Sedang Memverifikasi...
               </>
            ) : (
               "Masuk ke Aplikasi"
            )}
         </button>
      </div>
   );
}

export default function VerifyPage() {
   return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
         <Suspense fallback={<div className="w-full max-w-md bg-card border border-border/40 shadow-xl rounded-2xl p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={24} /></div>}>
            <VerifyContent />
         </Suspense>
      </div>
   );
}
