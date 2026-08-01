import { PrismaClient } from '@prisma/client';

export const seedLearnings = async (prisma: PrismaClient) => {
  const hasData = await prisma.learning.count();

  if (hasData) {
    console.log('No learnings seeded.');
    return;
  }

  const data = await prisma.learning.createMany({
    data: [
      {
        title: 'WHY',
        body: `<p>In recent years (post-pandemic) there has been a high turnover among frontline professionals. Agencies have been exploring ways to increase retention and provide greater financial security among BIPOC employees. Building Resilient Professionals (BRP) is a direct response to those concerns. Employees that meet with families in crisis face a higher level of burnout and secondary trauma.</p>
        <p>Our feedback and survey showed that the top 3 contributing factors for experiencing burnout are:</p>
        <ul>
        <li>feeling financially insecure</li>
        <li>feeling professionally isolate</li>
        <li>lacking opportunities for leadership development</li>
        </ul>
        <p>BRP is designed to invigorate and rejuvenate the frontline employee. Priority is given to those earning less than $55,000 working directly with clients and having more than 1-year on-the-job experience.</p>`,
        sequence: 1,
      },
      {
        title: 'GOALS',
        body: `<p>Increase financial security by providing matched savings</p>
        <ul>
        <li>Save up to $1,200</li>
        </ul>
        <p>Reduce professional isolation by networking with others</p>
        <ul>
        <li>Meet leaders in the field</li>
        </ul>
        <p>Professional advancement through leadership development programs</p>
        <ul>
        <li>Improve leadership skills</li>
        </ul>`,
        sequence: 2,
      },
      {
        title: 'PROGRAM',
        body: `<p>The Program Includes:</p>
        <ul>
        <li>Opportunity to save up to $1,200 in 6 months (with matched savings)</li>
        <li>Meeting other professionals through hybrid sessions including network lunches</li>
        <li>Leadership development through in person sessions and introduction to inspirational leaders in the field</li>
        <li>Individualized coaching and support</li>
        </ul>`,
        sequence: 3,
      },
    ],
  });

  console.log('learnings added: ', { data });
};
