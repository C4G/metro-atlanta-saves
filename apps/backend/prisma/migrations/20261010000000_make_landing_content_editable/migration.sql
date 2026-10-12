ALTER TABLE "Introduction"
ADD COLUMN "eyebrow" TEXT NOT NULL DEFAULT 'Metro Atlanta Saves',
ADD COLUMN "description" TEXT NOT NULL DEFAULT 'We are dedicated to empowering individuals and families through a range of financial literacy and wellbeing programs that foster economic stability and independence.',
ADD COLUMN "ctaText" TEXT NOT NULL DEFAULT 'Explore our programs';

ALTER TABLE "Description"
ADD COLUMN "eyebrow" TEXT NOT NULL DEFAULT 'What we do',
ADD COLUMN "programsJson" TEXT NOT NULL DEFAULT '[{"title":"Financial Achievement Club","description":"Financial Achievement Clubs engage families to work as a cohort over 6-8 months. The program requires education, saving and coaching. Upon completion, families that have saved every month for 6 months and attended the required number of learning sessions earn a 1:1 savings match (up to $600) and a $100 incentive for a 30-point improvement in their credit score over the 6 months."},{"title":"Building Resilient Professionals","description":"Building Resilient Professionals (BRP) provides participants with the opportunity to save up to $1,200 over six months through a matched savings program, while also building meaningful connections with other professionals through hybrid sessions and networking lunches. Participants receive individualized coaching and support tailored to their goals, as well as leadership development opportunities through in-person learning sessions and introductions to inspirational leaders in the field."},{"title":"Building Resilient Entrepreneurs","description":"The Building Resilient Entrepreneurs (BRE) initiative is crafted to assist micro-entrepreneurs and small business owners in establishing and growing their businesses while providing access to capital through matched savings incentives. BRE also offers a curated series of workshops and programming to address the accessibility challenges business owners face in accessing resources that can enhance their technical skills and business acumen."},{"title":"Wealth Builders United","description":"Wealth Builders United is a 6-month program focused on teaching strategies and techniques to make investing fun and empowering. Participants will learn the basics of investing with peers and mentors, and upon graduation, they will have up to $1,000 in their brokerage account, which includes a savings match."}]',
ADD COLUMN "factsEyebrow" TEXT NOT NULL DEFAULT 'Did you know',
ADD COLUMN "factsTitle" TEXT NOT NULL DEFAULT 'Many households are navigating financial uncertainty',
ADD COLUMN "factsSource" TEXT NOT NULL DEFAULT 'According to the Federal Reserve',
ADD COLUMN "factsJson" TEXT NOT NULL DEFAULT '[{"statistic":"37%","description":"of Americans lack enough money to cover a $400 emergency expense."},{"statistic":"7.41%","description":"Personal saving decreased by 7.41% from February 2024 to February 2025."},{"statistic":"2 years","description":"In the last two years, more Americans feel worse off financially than feel better off."}]';

ALTER TABLE "WhatWeAre"
ADD COLUMN "eyebrow" TEXT NOT NULL DEFAULT 'Who we are',
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Atlanta nonprofits working together',
ADD COLUMN "buttonText" TEXT NOT NULL DEFAULT 'Learn more about us',
ADD COLUMN "buttonLink" TEXT NOT NULL DEFAULT '/about-us',
ADD COLUMN "partnersJson" TEXT NOT NULL DEFAULT '[{"name":"Community Restoration Project","shortName":"CRP","description":"CRP sees underserved communities as an opportunity to provide the resources necessary to influence and ensure families and individuals have the tools they need to become self-sufficient and maintain productive and successful lives."},{"name":"Frontline Housing Inc.","shortName":"Frontline Housing","description":"Frontline Housing Inc. is a 501(c)(3) nonprofit organization that aims to make the experience of homelessness rare, brief and non-recurring. They meet individuals where they are through regular outreach events in Atlanta."},{"name":"Housing Plus Inc.","shortName":"Housing Plus","description":"Housing Plus delivers equitable housing solutions, economic wellness programs, and financial assistance for low-income households."},{"name":"Los Vecinos de Buford Highway","shortName":"Los Vecinos","description":"Los Vecinos de Buford Highway serves as a conduit of information and social capital in an effort to bridge the gap between residents in the Buford Highway area and government, housing, schools, and non-profit organizations by providing resources such as education, advocacy, food, and community events."},{"name":"Single Parent Alliance and Resource Center","shortName":"SPARC","description":"SPARC’s mission is to empower and equip single parents with the necessary tools, resources and support to enable them to create a healthy home environment and nurture their children into productive and successful adults."}]';

UPDATE "Description"
SET
  "title" = 'Explore our financial programs',
  "body" = 'Choose a program designed to help you save, learn, connect, and build lasting financial confidence.',
  "buttonText" = NULL,
  "buttonLink" = NULL
WHERE "title" = 'Financial Wellbeing Alliance programs';

UPDATE "WhatWeAre"
SET "whoWeAreDescription" = 'Founded in Atlanta, the Housing and Savings Collaborative is dedicated to providing financial solutions that uplift communities and foster economic stability for those in need. We are a collaborative group of Atlanta nonprofits.'
WHERE "whoWeAreDescription" = 'Building Resilient Professionals is a coalition of champions and agencies who can lead discussions and engage others.';
