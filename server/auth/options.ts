import EmailProvider from "next-auth/providers/email";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import PostgresAdapter from "@auth/pg-adapter";
import { getPool, hasDatabaseUrl } from "@/server/db/client";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: hasDatabaseUrl() ? PostgresAdapter(getPool()) : undefined,
  providers,
  session: {
    strategy: hasDatabaseUrl() ? "database" : "jwt"
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "registered";
      }
      return token;
    },
    async session({ session, token, user }) {
      const id = user?.id ?? token.id;
      const role = user?.role ?? token.role ?? "registered";
      if (session.user && id) {
        session.user.id = id;
        session.user.role = role;
      }
      return session;
    }
  }
};
