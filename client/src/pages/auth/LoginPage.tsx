import { Link } from "react-router";
import { Seo } from "@/components/common/Seo";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { buttonStyles } from "@/components/ui/button-styles";
import { SITE_NAME } from "@/config/site";

/** Placeholder: there is intentionally no form until authentication is built in Phase 3. */
export function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <Seo title="Sign in" noIndex />
      <Card padding="lg" className="w-full max-w-md">
        <img src="/favicon.svg" alt="" width="40" height="40" className="mb-5 size-10" />
        <h1 className="font-display text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">{SITE_NAME}</p>
        <Alert className="mt-6" title="Sign-in is not available yet">
          Secure sign-in for students, instructors and staff is built in Phase 3.
        </Alert>
        <Link to="/" className={`${buttonStyles({ variant: "secondary", fullWidth: true })} mt-6`}>
          Back to the website
        </Link>
      </Card>
    </div>
  );
}
