-- CreateTable
CREATE TABLE IF NOT EXISTS "PeerEvaluationGuide" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "PeerEvaluationGuide_pkey" PRIMARY KEY ("id")
);

-- SeedData
INSERT INTO "PeerEvaluationGuide" ("id", "body")
SELECT
    gen_random_uuid()::text,
    '<h2>Peer Evaluation Instructions</h2>
              <h3>Login Credentials</h3>
              <ul>
                <li><strong>Username:</strong> c4gpeereval@mailinator.com</li>
                <li><strong>Password:</strong> P@ssw0rd123!</li>
              </ul>
              <h3>Steps to Begin</h3>
              <ol>
                <li>Click <strong>Sign Up or Login</strong> (top right)</li>
                <li>Log in using the test credentials above</li>
                <li>After logging in keep scrolling down until you find the <strong>"C4G Team"</strong></li>
                <li>Click on <strong>"C4G Team"</strong>, navigate to the <strong>"Project Peer Evaluations"</strong></li>
                <li>Fill out the survey</li>
              </ol>
              <h3>Survey Link</h3>
              <p><a href="https://docs.google.com/forms/d/e/1FAIpQLSdTBikAkuv7J_7P2GvTRo31jEk01P4_IxXHZlijFZqKjmETow/viewform?usp=dialog" target="_blank">Click here to access the survey</a></p>'
WHERE NOT EXISTS (SELECT 1 FROM "PeerEvaluationGuide");
