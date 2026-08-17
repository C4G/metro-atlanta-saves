import { PrismaClient } from '@mas/prisma-client';

export const seedBlogs = async (prisma: PrismaClient) => {
  const hasData = await prisma.blog.count();

  if (hasData) {
    console.log('No blogs seeded.');
    return;
  }

  const data = await prisma.blog.createMany({
    data: [
      {
        title: 'The Ripple Effect of Saving Money',
        subTitle: 'Harnessing the Power of Compound Interest',
        slug: 'ripple-effect-of-saving-money',
        body: `<p>In a world where instant gratification often takes precedence, the idea of saving money might seem like a mundane or even daunting task. Yet, beneath its seemingly simple surface lies a profound force that has the potential to shape our financial future in ways we might not fully comprehend: the power of compound interest.</p>
        <h3>Understanding Compound Interest</h3>
        <p>At its core, compound interest is the interest on a loan or deposit that accrues not only on the initial principal but also on the accumulated interest from previous periods. In simpler terms, it's like a snowball rolling down a hill, gradually picking up more snow along the way. Over time, this compounding effect can significantly amplify the growth of your savings.</p>
        <p>Let's break it down with an example: Suppose you invest $1,000 in an account with an annual interest rate of 5%. In the first year, you'd earn $50 in interest, bringing your total to $1,050. In the second year, however, you wouldn't just earn $50 again; you'd earn 5% interest on the new total of $1,050, resulting in $52.50 in interest. As years pass, this process continues to accelerate, steadily increasing the growth of your savings.</p>
        <h3>The Magic of Time</h3>
        <p>One of the most crucial elements of harnessing the power of compound interest is time. The earlier you start saving, the more time your money has to grow. This is why financial advisors often stress the importance of starting to save and invest as soon as possible, even if it's just a small amount.</p>
        <p>Consider two individuals: Sarah, who starts saving $100 per month at age 25, and Mark, who waits until he's 35 to start saving the same amount. Assuming an average annual return of 7%, by the time they reach 65, Sarah would have over $300,000 more in her savings account than Mark, despite having contributed the same total amount.</p>
        <h3>Building Financial Security</h3>
        <p>Beyond the mathematical beauty of compound interest, saving money offers a sense of security and peace of mind. Whether it's creating an emergency fund to weather unexpected expenses or saving for retirement to enjoy your golden years without financial stress, building a savings habit lays the foundation for a more stable future.</p>
        <p>Moreover, having savings provides a buffer against life's uncertainties, allowing you to navigate challenging times with greater resilience. It empowers you to pursue opportunities, whether it's investing in further education, starting a business, or traveling the world.</p>
        <h3>Cultivating Discipline and Financial Literacy</h3>
        <p>Saving money isn't just about stashing cash away; it's about cultivating discipline and developing financial literacy. It requires making conscious choices about spending and prioritizing long-term goals over short-term desires. By mastering the art of saving, you not only strengthen your financial health but also cultivate valuable life skills that extend far beyond the realm of money.</p>
        <h3>Conclusion</h3>
        <p>In a world where instant gratification often tempts us to spend today what we could save for tomorrow, understanding the power of saving money is more critical than ever. Compound interest, fueled by the twin engines of time and discipline, has the potential to transform small, regular contributions into substantial wealth over the long term. By embracing the habit of saving, we not only secure our financial future but also empower ourselves to live more fulfilling and prosperous lives. So, let's start saving, one dollar at a time, and watch as the ripples of our financial decisions create waves of opportunity and abundance.</p>`,
      },
    ],
  });

  console.log('blogs added: ', { data });
};
