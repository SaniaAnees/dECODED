import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

/** Mumbai first — session was hopping to iad1 and stalling the header. */
export const preferredRegion = ["bom1", "iad1"];

const handler = NextAuth(getAuthOptions());

export { handler as GET, handler as POST };
