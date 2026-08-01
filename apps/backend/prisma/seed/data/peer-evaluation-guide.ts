import { PrismaClient } from '@prisma/client';

export const seedPeerEvaluationGuide = async (prisma: PrismaClient) => {
  const hasData = await prisma.peerEvaluationGuide.count();

  if (hasData) {
    console.log('No peer evaluation guide seeded.');
    return;
  }

  const data = await prisma.peerEvaluationGuide.createMany({
    data: [
      {
        body: `<h2>Peer Evaluation Instructions</h2>
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
              <p><a href="https://docs.google.com/forms/d/e/1FAIpQLSdTBikAkuv7J_7P2GvTRo31jEk01P4_IxXHZlijFZqKjmETow/viewform?usp=dialog" target="_blank">Click here to access the survey</a></p>`,
      },
    ],
  });

  console.log('peer evaluation guide added: ', { data });
};
