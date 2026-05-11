"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type FieldErrors = Record<string, string>;

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const errorClass = "text-sm text-red-600 mt-1";
const bannerClass =
  "mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700";

export const Home = () => {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <header className="bg-gray-50 flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Redwood SDK with Better-Auth on Cloudflare with D1
        </h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">
          A demo of RedwoodSDK's auth integration with Better-Auth, using
          Cloudflare D1 as the database. Try signing up and signing in.
        </h2>
        <ul>
          <li>
            <a
              href="https://rwsdk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              RedwoodSDK: A simple framework for humans
            </a>
          </li>
          <li>
            <a
              href="https://better-auth.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Better-Auth: The most comprehensive authentication framework.
            </a>
          </li>
          <li>
            <a
              href="https://www.cloudflare.com/developer-platform/products/d1/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Cloudflare D1: Create serverless SQL databases
            </a>
          </li>
        </ul>
      </header>
      <div className="bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <SignUpForm />
          <SignInForm />
        </div>
      </div>
    </main>
  );
};

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBanner(null);
    setFieldErrors({});

    const { error } = await authClient.signUp.email({ name, email, password });

    if (error) {
      // Inspect error.code at dev time to determine field-level mappings.
      // Unknown codes fall through to the banner.
      setBanner(error.message ?? "Sign up failed. Please try again.");
    } else {
      window.location.href = "/app";
    }

    setLoading(false);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Create an account
      </h2>
      {banner && <p className={bannerClass}>{banner}</p>}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="signup-name" className={labelClass}>
            Name
          </label>
          <input
            id="signup-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            className={inputClass}
          />
          {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="signup-email" className={labelClass}>
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            className={inputClass}
          />
          {fieldErrors.email && (
            <p className={errorClass}>{fieldErrors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="signup-password" className={labelClass}>
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            className={inputClass}
          />
          {fieldErrors.password && (
            <p className={errorClass}>{fieldErrors.password}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </section>
  );
};

const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setBanner(null);
    setFieldErrors({});

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      // Inspect error.code at dev time to determine field-level mappings.
      // Unknown codes fall through to the banner.
      setBanner(error.message ?? "Sign in failed. Please try again.");
    } else {
      window.location.href = "/app";
    }

    setLoading(false);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>
      {banner && <p className={bannerClass}>{banner}</p>}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="signin-email" className={labelClass}>
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            className={inputClass}
          />
          {fieldErrors.email && (
            <p className={errorClass}>{fieldErrors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="signin-password" className={labelClass}>
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            className={inputClass}
          />
          {fieldErrors.password && (
            <p className={errorClass}>{fieldErrors.password}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
};
