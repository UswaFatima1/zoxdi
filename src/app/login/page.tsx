"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/layout/Avatar";
import { MiniDemo } from "@/components/learning/MiniDemo";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { initialsFromName } from "@/lib/storage/progress";
import { accountExists, hasAccounts, isValidEmail, MIN_PASSWORD_LENGTH } from "@/lib/storage/accounts";
import { AVATARS, avatarForName, defaultShopName } from "@/lib/profile/identity";
import { trackEvent } from "@/lib/analytics/ga";

const PITCH = [
  { icon: "🎮", title: "Play, don't memorise", body: "40 levels, from your first dollar to the balance sheet." },
  { icon: "🩺", title: "Mistakes get fixed", body: "Every wrong answer is named, explained and re-taught." },
  { icon: "⚡", title: "Two-minute habits", body: "A daily challenge and a speed round that keep it sharp." },
  { icon: "🏆", title: "A board to climb", body: "Earn XP, unlock badges, and top the leaderboard." },
];

type Mode = "login" | "signup";
type SignUpStep = "identity" | "shop";

export default function LoginPage() {
  const { profile, signUp, logIn, signOut, cloudEnabled } = useProgressContext();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<SignUpStep>("identity");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatar, setAvatar] = useState("");
  const [shopName, setShopName] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // A brand-new visitor has no account yet; nudge them toward sign-up.
  useEffect(() => {
    if (!cloudEnabled && !hasAccounts()) setMode("signup");
  }, [cloudEnabled]);

  const nameError = name.trim().length < 2 ? "Please enter your name." : "";
  const emailError = !isValidEmail(email) ? "Enter a valid email, e.g. alex@gmail.com" : "";
  const passwordError =
    password.length < MIN_PASSWORD_LENGTH
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`
      : "";
  const confirmError = confirm !== password ? "Passwords don't match yet." : "";
  const loginValid = !emailError && password.length > 0;
  const identityValid = !nameError && !emailError && !passwordError && !confirmError;

  const initials = name.trim() ? initialsFromName(name) : "?";
  const chosenAvatar = avatar || avatarForName(name || "New learner");
  const chosenShop = shopName.trim() || defaultShopName(name);

  const reset = () => {
    setPassword("");
    setConfirm("");
    setTouched(false);
    setError("");
    setPending(false);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStep("identity");
    reset();
  };

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setError("");
    if (!loginValid) return;
    setPending(true);
    try {
      const result = await logIn(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      trackEvent("login", { method: "password" });
      router.replace("/learn/");
    } finally {
      setPending(false);
    }
  };

  const submitIdentity = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setError("");
    if (!identityValid) return;
    if (!cloudEnabled && accountExists(email)) {
      setError("That email already has an account — try logging in.");
      return;
    }
    setAvatar((current) => current || avatarForName(name));
    setStep("shop");
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await signUp({
        name,
        email,
        password,
        avatar: chosenAvatar,
        shopName: chosenShop,
      });
      if (!result.ok) {
        setError(result.error);
        setStep("identity");
        return;
      }
      trackEvent("sign_up", { method: "email" });
      router.replace("/learn/");
    } finally {
      setPending(false);
    }
  };

  const signedIn = Boolean(profile);

  return (
    <div className="relative overflow-hidden py-10">
      {/* Bright background blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-credit/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-debit/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl items-start gap-8 lg:grid-cols-2">
        {/* Pitch + instant demo */}
        <div className="animate-slide-up space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl grad-ig p-1">
              <div className="rounded-[14px] bg-paper-card px-3 py-1.5">
                <span className="text-2xl font-black text-ig">Zoxdi</span>
              </div>
            </div>
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-black uppercase tracking-wider text-gold-deep">
              Beginner → Pro
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">
              Run a shop.
              <br />
              <span className="text-ig">Master the books.</span>
            </h1>
            <p className="mt-3 max-w-md text-ink-muted">
              Accounting, taught as a game you can win. Create an account to keep
              your progress, badges and streak — then answer one right now.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PITCH.map((item) => (
              <div
                key={item.title}
                className="rounded-xl2 border border-line bg-paper-card p-3 shadow-card"
              >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <p className="mt-1 text-sm font-black leading-tight text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs leading-snug text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>

          <MiniDemo />
        </div>

        {/* The welcome card */}
        <div className="animate-slide-up lg:sticky lg:top-24">
          <div className="grad-ring overflow-hidden rounded-xl3 border border-line/60 bg-paper-card p-7 shadow-lift sm:p-8">
            {/* Log in / Sign up switch */}
            <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-paper-sunken/60 p-1">
              {(["login", "signup"] as Mode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => switchMode(option)}
                  className={`rounded-full py-2 text-sm font-black transition ${
                    mode === option ? "bg-ig-135 text-white shadow-glow" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {option === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            {mode === "login" ? (
              <>
                <div className="mt-6 text-center">
                  <h2 className="text-2xl font-black text-ink">Welcome back</h2>
                  <p className="mt-1.5 text-sm text-ink-muted">
                    Log in to reopen your books and carry on where you left off.
                  </p>
                </div>

                <form onSubmit={submitLogin} className="mt-5 space-y-4" noValidate>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-ink-soft">Email</span>
                    <input
                      type="email"
                      value={email}
                      inputMode="email"
                      autoFocus
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="alex@gmail.com"
                      className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
                    />
                    {touched && emailError ? (
                      <span className="mt-1 block text-xs font-semibold text-bad">{emailError}</span>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-ink-soft">Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Your password"
                      className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
                    />
                  </label>

                  {error ? (
                    <p className="rounded-xl border border-bad/40 bg-bad-soft/50 px-3 py-2 text-xs font-bold text-bad">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-xl bg-ig-135 py-3.5 text-base font-black text-white shadow-glow transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Logging in…" : "Log in →"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-ink-muted">
                  New to Zoxdi?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-black text-credit hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </>
            ) : step === "identity" ? (
              <>
                <div className="mt-6 text-center">
                  <p className="text-xs font-black uppercase tracking-wide text-credit">
                    Step 1 of 2
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-ink">Start your money story</h2>
                  <p className="mt-1.5 text-sm text-ink-muted">
                    Create an account to save progress and join the leaderboard.
                  </p>
                </div>

                <form onSubmit={submitIdentity} className="mt-5 space-y-4" noValidate>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-ink-soft">Name</span>
                    <input
                      type="text"
                      value={name}
                      autoFocus
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
                    />
                    {touched && nameError ? (
                      <span className="mt-1 block text-xs font-semibold text-bad">{nameError}</span>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-ink-soft">Email</span>
                    <input
                      type="email"
                      value={email}
                      inputMode="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="alex@gmail.com"
                      className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
                    />
                    {touched && emailError ? (
                      <span className="mt-1 block text-xs font-semibold text-bad">{emailError}</span>
                    ) : null}
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-bold text-ink-soft">Password</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={`${MIN_PASSWORD_LENGTH}+ characters`}
                        className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
                      />
                      {touched && passwordError ? (
                        <span className="mt-1 block text-xs font-semibold text-bad">{passwordError}</span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-bold text-ink-soft">Confirm</span>
                      <input
                        type="password"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        placeholder="Again"
                        className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
                      />
                      {touched && confirmError ? (
                        <span className="mt-1 block text-xs font-semibold text-bad">{confirmError}</span>
                      ) : null}
                    </label>
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-bad/40 bg-bad-soft/50 px-3 py-2 text-xs font-bold text-bad">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-ig-135 py-3.5 text-base font-black text-white shadow-glow transition hover:opacity-95 active:scale-[0.99]"
                  >
                    Continue →
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-ink-muted">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-black text-credit hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </>
            ) : (
              <form onSubmit={createAccount} className="mt-6 space-y-5">
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-wide text-credit">
                    Step 2 of 2
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-ink">
                    Open your shop, {name.split(" ")[0] || "friend"}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-muted">
                    Pick a look and name your business. You can change both later.
                  </p>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-bold text-ink-soft">Choose your avatar</span>
                  <div className="grid grid-cols-8 gap-1.5">
                    {AVATARS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAvatar(option)}
                        aria-label={`Choose avatar ${option}`}
                        className={`flex aspect-square items-center justify-center rounded-xl border-2 text-xl transition ${
                          chosenAvatar === option
                            ? "border-credit bg-credit-soft/40 scale-105"
                            : "border-line bg-paper hover:border-credit/40"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-ink-soft">Shop name</span>
                  <input
                    type="text"
                    value={shopName}
                    maxLength={40}
                    onChange={(event) => setShopName(event.target.value)}
                    placeholder={defaultShopName(name)}
                    className="w-full rounded-xl border-2 border-line bg-paper px-4 py-3 font-semibold text-ink outline-none transition focus:border-credit"
                  />
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-sunken/50 p-3">
                  <Avatar profile={{ name, initials, avatar: chosenAvatar }} size={44} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Welcome to</p>
                    <p className="truncate text-lg font-black text-ink">{chosenShop}</p>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-xl border border-bad/40 bg-bad-soft/50 px-3 py-2 text-xs font-bold text-bad">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-ig-135 py-3.5 text-base font-black text-white shadow-glow transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Creating your shop…" : "Create account 🚀"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="w-full text-center text-xs font-bold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  ← Back
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-xs text-ink-muted">
              Your account and progress are saved securely to Zoxdi, so you can
              carry on from any device.
            </p>

            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  switchMode("login");
                }}
                className="mt-3 w-full text-center text-xs font-bold text-ink-muted underline-offset-2 hover:text-bad hover:underline"
              >
                Use a different account
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
