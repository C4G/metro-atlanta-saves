import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'mas-privacy-policy',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="mx-auto max-w-4xl px-6 py-12 sm:px-10">
      <h1 class="text-4xl font-bold">Privacy Policy</h1>
      <p class="mt-3">Last updated September 28, 2026</p>

      <p class="mt-8">
        Building Resilient Professionals (BRP) uses this website to provide financial wellbeing programs, educational
        resources, and discussion spaces. This policy explains what information we collect through the site, how we use
        it, and when we share it. It applies to the public site and to accounts created with email or Google sign-in,
        including Google One Tap.
      </p>

      <section class="mt-10" aria-labelledby="information-we-collect">
        <h2 id="information-we-collect" class="text-2xl font-semibold">Information we collect</h2>
        <ul class="mt-4 list-disc space-y-3 pl-6">
          <li>
            <strong>Account information:</strong>
            Your name, email address, profile details, and sign-in credentials. For email sign-in, we store a password
            hash. For Google sign-in, we receive your Google account identifier, name, email address, email verification
            status, and profile image when available. Our authentication service may store Google authentication tokens
            associated with your account.
          </li>
          <li>
            <strong>Program information:</strong>
            Information you enter when applying for or participating in a program, which may include your phone number,
            address, birthdate, employment and income details, race, gender, and program progress. You may also upload
            documents or images for program activities.
          </li>
          <li>
            <strong>Community information:</strong>
            Posts, comments, votes, and other information you choose to share in discussion boards.
          </li>
          <li>
            <strong>Technical information:</strong>
            Session cookies and records needed to keep you signed in, which may include your IP address and browser
            information. The site also loads an analytics script that measures visits and usage. If you enable browser
            push notifications, we store a browser push subscription.
          </li>
        </ul>
      </section>

      <section class="mt-10" aria-labelledby="how-we-use-information">
        <h2 id="how-we-use-information" class="text-2xl font-semibold">How we use information</h2>
        <p class="mt-4">
          We use this information to create and protect accounts, sign you in, process program applications and
          participation, run discussion boards, send account and program messages, deliver notifications you enable,
          understand site usage, and maintain and improve the service.
        </p>
        <p class="mt-4">
          Google sign-in and One Tap are used to authenticate you and connect your Google identity to your BRP account.
          We do not request access to your Gmail, Google Drive, or other Google content for sign-in.
        </p>
      </section>

      <section class="mt-10" aria-labelledby="sharing-information">
        <h2 id="sharing-information" class="text-2xl font-semibold">When information is shared</h2>
        <p class="mt-4">
          Authorized BRP staff and program partners may access information needed to administer programs and support
          participants. Information you post in a discussion board can be seen by people who have access to that board.
          We also use service providers to host the site, send email and push notifications, and measure site usage.
          Google processes information when you choose Google sign-in or One Tap. We may disclose information when
          required by law or to protect the security of the service and its users.
        </p>
      </section>

      <section class="mt-10" aria-labelledby="choices-and-retention">
        <h2 id="choices-and-retention" class="text-2xl font-semibold">Your choices and data retention</h2>
        <p class="mt-4">
          You can use email and password instead of Google sign-in. You can disable browser push notifications in your
          browser settings. You may request access to, correction of, or deletion of your account information by
          contacting us. We retain information while it is needed to provide the service and administer programs; some
          records may remain in backups or be retained when required by law.
        </p>
      </section>

      <section class="mt-10" aria-labelledby="security-and-changes">
        <h2 id="security-and-changes" class="text-2xl font-semibold">Security and changes</h2>
        <p class="mt-4">
          We use safeguards to protect information, but no online service can guarantee complete security. We may update
          this policy as the site changes. The date at the top shows when it was last updated.
        </p>
      </section>

      <section class="mt-10" aria-labelledby="contact-us">
        <h2 id="contact-us" class="text-2xl font-semibold">Contact us</h2>
        <p class="mt-4">
          For privacy questions or requests, email
          <a class="underline" href="mailto:admin@brpatl.com">admin&#64;brpatl.com</a>
          .
        </p>
      </section>
    </article>
  `,
})
export class PrivacyPolicyComponent {}
