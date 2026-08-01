import { PrismaClient } from '@prisma/client';

export const seedUserGuide = async (prisma: PrismaClient) => {
  const hasData = await prisma.userGuide.count();

  if (hasData) {
    console.log('No user guide seeded.');
    return;
  }

  const data = await prisma.userGuide.createMany({
    data: [
      {
        body: `<h2>1. Introduction</h2>
              <p>Welcome to the user guide. This guide will help you understand how to use the product efficiently.</p>
              <h2>2. Getting Started</h2>
              <ul>
              <li>Logging In</li>
              </ul>
              <h2>3. User Interface Overview</h2>
              <ul>
              <li>Dashboard</li>
              <li>Navigation Panel</li>
              <li>Programs</li>
              </ul>
              <h2>4. Core Features</h2>
              <ul>
              <li><span style="text-decoration: underline;">Programs</span>: The program(s) that you are a part of can be accessed via the collapsible "<strong>Programs</strong>" menu item in the <strong>Navigation Panel</strong>.<br><br>
              <div><em>How-To</em>:</div>
              <div>
              <ol>
              <li>To view your progress, requirements, etc. for a particular program, click on the desired <strong><span style="color: #843fa1;">program name</span> </strong>within the the collapsible "<span style="color: #3598db;"><strong>Programs</strong></span>" menu.</li>
              <li>Once a program is selected, you will see a <span style="color: #3598db;"><strong>description</strong></span> of the program, the <span style="color: #3598db;"><strong>participants</strong></span>, and your <span style="color: #3598db;"><strong>progress</strong></span> (also available at the top as a progress bar, right under the program name), <span style="color: #3598db;"><strong>total saved</strong></span>, and <span style="color: #3598db;"><strong>history</strong></span>.</li>
              <li>Clicking on the "<strong><span style="color: #3598db;">My Progress</span></strong>" tab displays tiles with the training resources that need to be completed (outlined in <span style="color: #e03e2d;">red</span>) or have been completed (outlined in <span style="color: #2dc26b;">green</span>).</li>
              <li>Clicking the "<span style="color: #3598db;"><strong>My</strong> <strong>History</strong></span>" tab displays your <span style="color: #3598db;"><strong>total savings</strong></span> throughout the program, as well as the <span style="color: #3598db;"><strong>credit score increase</strong></span>. The table displays:
              <ul>
              <li>checkpoints</li>
              <li>amount of money saved at each checkpoint</li>
              <li>credit score at that checkpoint,</li>
              <li>&nbsp;whether an image is attached and verified</li>
              <li>&nbsp;available actions (i.e., <span style="color: #843fa1;"><strong>view</strong></span> or <span style="color: #843fa1;"><strong>add image</strong></span>)<br><br>* If a checkpoint does not have an image, one can be uploaded by selecting the&nbsp;<strong>three dots</strong> in the "<span style="color: #3598db;"><strong>Actions</strong></span>" column for that checkpoint. Then, select the "<span style="color: #3598db;"><strong>+ Add Image</strong></span>" option. A modal will open prompting you to select a banking receipt. Once you&rsquo;ve selected the appropriate receipt, click &ldquo;<span style="color: #843fa1;"><strong>Add</strong></span>&rdquo; to associate the image with the checkpoint.&nbsp;</li>
              </ul>
              </li>
              </ol>
              </div>
              </li>
              </ul>
              <h2>5. Advanced Settings</h2>
              <ul>
              <li>Customization Options
              <ul>
              <li>Dark &amp; Light Mode Toggle: Users can seamlessly switch between "Dark Mode" and "Light Mode" using a toggle button located at the top right-hand side of the toolbar. When toggled, the icon dynamically changes between a sun (light mode) and a moon (dark mode), ensuring a visually adaptive experience.&nbsp;&nbsp;</li>
              </ul>
              </li>
              </ul>
              <h2>6. Troubleshooting</h2>
              <ul>
              <li>Common Issues &amp; Fixes</li>
              </ul>
              <h2>7. FAQs</h2>
              <ul>
              <li>Frequently Asked Questions</li>
              </ul>`,
      },
    ],
  });

  console.log('user guide added: ', { data });
};
