import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import Head from "next/head";
import { Navbar } from "~/components/Navbar";
import { LowerBar } from "~/components/LowerBar";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Reddit Clone</title>
        <meta name="description" content="This is Reddit clone by me"/>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-grow border-x">
          <Component {...pageProps} />
        </div>
        <LowerBar/>
      </div>  
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
