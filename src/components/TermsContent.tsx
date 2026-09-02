import { TERMS_DATA_COLLECTION } from '@/lib/auth-types';

export function TermsContent() {
  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
      <section>
        <h3 className="text-foreground font-semibold mb-2">Terms &amp; Conditions</h3>
        <p>
          By using Pins Pets during the beta period, you agree to these terms. Pins Pets is a visual
          pet medication tracker intended for personal organization. It does not provide veterinary
          or medical advice.
        </p>
      </section>

      <section>
        <h3 className="text-foreground font-semibold mb-2">Privacy &amp; Data Collection</h3>
        <p className="border-l-2 border-primary pl-3 text-foreground/90">{TERMS_DATA_COLLECTION}</p>
      </section>

      <section>
        <h3 className="text-foreground font-semibold mb-2">Local-First Health Data</h3>
        <p>
          Your pet logs, inventory, and schedule remain encrypted on your device by default.
          Account sign-in stores only anonymous demographic stats (age range and gender) for
          aggregate reporting. Pet health data is not uploaded unless you later enable cloud backup.
        </p>
      </section>

      <section>
        <h3 className="text-foreground font-semibold mb-2">Beta Disclaimer</h3>
        <p>
          Pins Pets is in beta. Features may change or be unavailable. Always consult a qualified
          veterinarian for medical decisions about your pet.
        </p>
      </section>
    </div>
  );
}