import { Suspense } from "react";
import { VerifyOTPForm } from "./verify-otp-form";

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={null}>
            <VerifyOTPForm />
        </Suspense>
    );
}
