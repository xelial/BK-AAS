import { getUserByEmail } from "@/app/lib/auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          const email = credentials.email;
          const password = credentials.password;

          const user = await getUserByEmail(email);

          if (!user) return null;

          // Bandingkan password secara plain text
          if (password !== user.password) return null;

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
