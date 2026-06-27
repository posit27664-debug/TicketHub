import { prisma } from "./client";

type Status = "OPEN" | "RESOLVED" | "CLOSED";
type Category = "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST";

const customers = [
  { name: "Alice Wonderland", email: "alice@example.com" },
  { name: "Bob Martinez", email: "bob.martinez@gmail.com" },
  { name: "Clara Fujimoto", email: "clara.f@outlook.com" },
  { name: "David Kim", email: "david.kim@proton.me" },
  { name: "Elena Petrova", email: "elena.p@yahoo.com" },
  { name: "Frank Okafor", email: "frank.okafor@gmail.com" },
  { name: "Grace Chen", email: "grace.chen@icloud.com" },
  { name: "Hassan Ali", email: "hassan.ali@outlook.com" },
  { name: "Iris van der Meer", email: "iris.vdm@example.com" },
  { name: "James Wilson", email: "jwilson@gmail.com" },
  { name: "Katherine Lee", email: "katherine.lee@proton.me" },
  { name: "Liam O'Brien", email: "liam.obrien@outlook.com" },
  { name: "Maria Santos", email: "maria.santos@yahoo.com" },
  { name: "Naveen Patel", email: "naveen.patel@gmail.com" },
  { name: "Olivia Brown", email: "olivia.brown@icloud.com" },
  { name: "Pierre Dubois", email: "pierre.dubois@example.com" },
  { name: "Quinn Sullivan", email: "quinn.s@proton.me" },
  { name: "Rosa Mendes", email: "rosa.mendes@outlook.com" },
  { name: "Satoshi Tanaka", email: "satoshi.t@yahoo.com" },
  { name: "Tina Fey", email: "tina.fey@gmail.com" },
  { name: "Umar Khan", email: "umar.khan@icloud.com" },
  { name: "Valeria Russo", email: "valeria.russo@example.com" },
  { name: "Wei Zhang", email: "wei.zhang@outlook.com" },
  { name: "Ximena Lopez", email: "ximena.lopez@gmail.com" },
  { name: "Yuki Nakamura", email: "yuki.nakamura@proton.me" },
  { name: "Zara Ahmed", email: "zara.ahmed@yahoo.com" },
  { name: "Adam Cohen", email: "adam.cohen@icloud.com" },
  { name: "Beatrice Njenga", email: "beatrice.n@gmail.com" },
  { name: "Carlos Rivera", email: "carlos.r@outlook.com" },
  { name: "Diana Popescu", email: "diana.popescu@example.com" },
  { name: "Erik Johansson", email: "erik.j@proton.me" },
  { name: "Fatima Al-Rashid", email: "fatima.ar@yahoo.com" },
  { name: "George Papadopoulos", email: "george.p@gmail.com" },
  { name: "Hannah Müller", email: "hannah.muller@icloud.com" },
  { name: "Isaac Torres", email: "isaac.torres@outlook.com" },
  { name: "Julia Kowalski", email: "julia.k@example.com" },
  { name: "Kofi Asante", email: "kofi.asante@gmail.com" },
  { name: "Lena Schneider", email: "lena.schneider@proton.me" },
  { name: "Mei-Lin Huang", email: "meilin.h@yahoo.com" },
  { name: "Nathan Drake", email: "nathan.d@icloud.com" },
];

const agentUsers = [
  { id: "cmqqfm50t0001xrlb0qs6acpe", name: "Support Account" },
  { id: "7KmIxnodwGCT0slSWBUsofmmuMUO2101", name: "Admin User" },
  { id: "cmqrpwi4w0000iflb4hm7ozzi", name: "Harshit" },
];

const tickets: {
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  status: Status;
  category: Category;
  assignedAgentId: string | null;
  createdAt: Date;
}[] = [];

function daysAgo(d: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(Math.floor(Math.random() * 14) + 8);
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const generalSubjects: [string, string][] = [
  ["Course certificate delivery", "I completed the Web Dev Bootcamp last week. When will I receive my certificate?"],
  ["Change email on account", "I need to update the email address associated with my account from old@email.com to new@email.com."],
  ["Can I share my account?", "Is it allowed to share my account with a family member? We'd like to take courses together."],
  ["Group discount for team", "Our team of 5 wants to enroll. Do you offer group discounts or team pricing?"],
  ["Course prerequisites", "Do I need prior programming experience before taking the Data Structures course?"],
  ["Payment not going through", "My credit card keeps getting declined but my bank says there's no issue. What could be wrong?"],
  ["Mobile app not working", "The mobile app crashes on startup on my Android phone. I've tried reinstalling."],
  ["How to download videos", "Is there a way to download course videos for offline viewing on the mobile app?"],
  ["Refund timeline question", "How long does it typically take for a refund to appear on my credit card?"],
  ["Course bundle pricing", "Is there a discount if I purchase the full stack bundle instead of individual courses?"],
  ["Multiple devices", "Can I be logged in on multiple devices at the same time?"],
  ["Account deletion request", "I'd like to delete my account and all associated data. How do I proceed?"],
  ["Course recommendations", "I finished the Python basics course. What would you recommend as a next step?"],
  ["Payment receipt", "I need a receipt for my purchase on March 3rd for tax purposes. Can you resend it?"],
  ["Language subtitles", "Are there Spanish subtitles available for the JavaScript course?"],
  ["Trial period", "Do you offer a free trial period before committing to a paid plan?"],
  ["Update profile picture", "I can't seem to change my profile picture in the settings page."],
  ["Course rating system", "How does the course rating system work? Can I update my rating after posting?"],
  ["Notifications not working", "I'm not receiving email notifications when new content is added to my courses."],
  ["Referral program", "How does the referral program work? I'd like to invite my friends."],
  ["Transfer course to another account", "I bought a course on my work email but want it on my personal account. Can you transfer it?"],
  ["Course content outdated", "The Angular course was last updated 2 years ago. Will there be an update soon?"],
  ["Accessibility features", "Are there accessibility options for visually impaired users? I need screen reader support."],
  ["Student discount", "I'm a university student. Do you offer a student discount on annual plans?"],
  ["Instructor application", "I'd like to become an instructor on your platform. How do I submit a course proposal?"],
  ["Course schedule for live classes", "Are the live sessions recorded if I can't attend at the scheduled time?"],
  ["Two-factor authentication", "Do you support two-factor authentication for account security?"],
  ["Lifetime access clarification", "Does lifetime access really mean forever, or is there a catch?"],
  ["How to reset password", "I forgot my password and the reset link isn't arriving in my inbox or spam folder."],
  ["Course completion percentage wrong", "My profile says 95% complete for a course I finished last month. Can you fix this?"],
  ["Bookmark feature", "Is there a way to bookmark specific lessons within a course for quick access later?"],
  ["Payment plans available", "I can't afford the full price upfront. Do you offer monthly payment plans or financing?"],
  ["Gift card purchase", "I want to buy a course as a gift for a friend. How does the gifting process work?"],
  ["Download invoice for reimbursement", "My employer will reimburse the course cost. I need an invoice with my company's tax ID on it."],
];

const technicalSubjects: [string, string][] = [
  ["Video player stuck on loading", "The video player keeps buffering at 99% even though my internet connection is stable at 100Mbps."],
  ["404 error on dashboard", "After logging in I get a 404 error on the dashboard page. This started today."],
  ["Code editor not compiling", "The built-in code editor shows compilation errors for code that runs fine on my local machine."],
  ["Quiz submission failed", "I completed a quiz but when I hit submit, it showed an error and my answers were lost."],
  ["Broken link in lesson 5", "The 'Additional Resources' link in lesson 5 of the React course returns a 404."],
  ["Progress not saving", "My course progress resets to 0% every time I close the browser. Using Chrome version 124."],
  ["Syntax highlighting broken", "The syntax highlighting in the Python editor stopped working after the last update."],
  ["Unable to upload project", "I keep getting 'File too large' error when uploading my project. The file is only 15MB."],
  ["Audio desync in lectures", "The audio is about 3 seconds behind the video in lecture 12 of the Docker course."],
  ["Dark mode flickering", "When switching between pages in dark mode, the screen flashes white briefly."],
  ["SSO login loop", "When I try to log in with Google SSO, it redirects to a blank page and loops back to login."],
  ["Download fails on Safari", "Course materials fail to download on Safari 17 but work fine on Chrome."],
  ["Search returning no results", "The search feature returns no results even for exact course names."],
  ["Certificate image broken", "My earned certificate shows a broken image icon instead of the actual certificate."],
  ["Email verification link expired", "The verification email link expired before I could click it. Can you resend?"],
  ["API rate limiting my requests", "I'm getting 429 errors when trying to access course content through the API."],
  ["Timer on exam incorrect", "The countdown timer on my final exam started at 45 minutes instead of 90 minutes."],
  ["Drag and drop not working", "The drag-and-drop exercise in lesson 3 doesn't work on Firefox."],
  ["Page layout broken on tablet", "The course page layout is completely broken on iPad Air in landscape mode."],
  ["WebSocket connection failed", "The real-time collaboration feature shows 'WebSocket connection failed'. Port 443 is open."],
  ["Markdown renderer broken", "Code blocks in the lesson comments are not rendering properly. They show raw markdown instead of formatted text."],
  ["Grading engine timeout", "My final exam submission has been stuck on 'Grading' for over 2 hours. How long should this take?"],
  ["Video progress bar glitch", "Dragging the progress bar on video lectures snaps back to the original position instead of seeking."],
  ["Session timeout too aggressive", "I get logged out after 5 minutes of inactivity even though I'm still reading the lesson page."],
  ["Course export fails", "Attempting to export my completed course summary as PDF throws an internal server error."],
  ["Authentication with Apple ID", "Sign-in with Apple returns 'invalid_client' error. It worked last week."],
  ["Chrome extension conflict", "When I have the Grammarly extension enabled, the code editor input field becomes unresponsive."],
  ["Keyboard shortcuts conflict", "Ctrl+S in the code editor triggers the browser save dialog instead of saving my code."],
  ["Mobile push notifications broken", "I enabled push notifications but never receive them on my iPhone even though they're allowed in settings."],
  ["Account takeover attempt", "I received a password reset email that I didn't request. Has my account been compromised?"],
  ["Database migration error", "I received a 'Database migration failed' error when trying to create a new project workspace."],
  ["Image upload orientation wrong", "When I upload a portrait photo from my phone, it displays sideways in my profile."],
  ["Browser back button breaks app", "Pressing the browser back button on the checkout page shows a blank white screen."],
  ["Real-time notification delay", "There's a 5-10 minute delay between when someone replies to my thread and when I get the notification."],
  ["SSH key upload fails", "I'm trying to upload my SSH public key for Git integration but get 'invalid format' even though the key works fine with GitHub."],
];

const refundSubjects: [string, string][] = [
  ["Refund request - React Mastery", "I purchased the React Mastery course two days ago but found the content too basic. Requesting a full refund."],
  ["Cancelled subscription by mistake", "I accidentally cancelled my annual subscription. Can I get it reinstated?"],
  ["Double charge on my card", "I was charged twice for the monthly subscription on April 1st. Please refund the duplicate."],
  ["Disappointed with course quality", "The Advanced Machine Learning course has poor audio quality and outdated content. I want a refund."],
  ["Purchased wrong course", "I meant to buy the UI/UX course but accidentally purchased the Frontend course. Can you switch or refund?"],
  ["Course not as advertised", "The description promised 40 hours of content but there are only 12 hours. Requesting a partial refund."],
  ["Medical issue - need refund", "I had surgery and won't be able to study for the next 6 months. Requesting a refund for my recent purchase."],
  ["Duplicate purchase", "My friend already bought the course and gifted me access. I accidentally purchased it again."],
  ["Lost access after upgrade", "I upgraded my plan but lost access to courses I previously purchased. Please fix or refund."],
  ["Free trial not honoured", "I signed up for the 7-day free trial but was charged immediately. Please refund."],
  ["Billing error - wrong amount", "I was charged $299 instead of the listed $199 price. Please correct this."],
  ["Unsatisfied with instructor", "The instructor for the AWS course is hard to understand and doesn't answer questions. Requesting refund."],
  ["Course not available in region", "I purchased the course but it says 'not available in your region'. I wasn't warned about this."],
  ["Enterprise plan too limited", "We bought the enterprise plan but the admin features are too limited for our team of 50."],
  ["Payment method stolen", "Someone used my saved card to purchase a course. I need a refund and the card removed."],
  ["Discount code not applied", "I used a 50% discount code but was charged full price. Requesting the difference back."],
  ["Course removed from library", "The 'Kubernetes for Beginners' course I purchased last month is no longer in my library."],
  ["Request partial refund", "I've completed 3 out of 20 modules but the course isn't what I expected. Can I get a partial refund?"],
  ["Family emergency", "Due to a family emergency I need to cancel my subscription and request a refund for the remaining months."],
  ["Auto-renewed without consent", "My subscription auto-renewed but I didn't authorize it. I want to cancel and get a refund."],
  ["Refund for team member", "I purchased a team plan but one of my team members left the company. Can I get a prorated refund?"],
  ["Course changed after purchase", "The curriculum was updated after I bought it and several modules I wanted were removed. This isn't what I paid for."],
  ["Refund - deceased family member", "My father passed away and he had an active subscription. I need to cancel and request a refund for the unused portion."],
  ["Wrong currency charged", "I was charged in USD but my account was set to EUR. The exchange rate cost me extra. Please refund the difference."],
  ["Course too advanced", "I bought the Advanced DevOps course but it assumes knowledge I don't have. The description didn't mention the prerequisites clearly."],
  ["Duplicate subscription billing", "I'm being billed for two separate subscriptions but I only have one account. The second charge started this month."],
  ["Promo code error charged full price", "I entered a valid promo code but the system applied the full price. Support chat couldn't help. Requesting the discounted amount refunded."],
  ["Course quality substandard", "The 'Mastering CSS Grid' course has slides with typos, broken examples, and the instructor mumbles. Definitely not worth $150."],
  ["Employer switched platforms", "My company switched to a different training provider. I no longer need my personal subscription. Requesting a prorated refund for the remaining 8 months."],
  ["Content not delivered as promised", "The course promised downloadable exercise files and a Slack community, but neither is accessible. I want a full refund."],
  ["Subscription paused but still charged", "I paused my subscription for 3 months but was charged during the pause period. I need this reversed."],
];

function buildTickets(): void {
  let idx = 0;

  // 34 general questions
  for (const [subject, body] of generalSubjects) {
    const c = customers[idx % customers.length];
    const days = Math.floor(Math.random() * 28);
    tickets.push({
      subject,
      body,
      fromName: c.name,
      fromEmail: c.email,
      status: pick<Status>(["OPEN", "RESOLVED", "CLOSED"]),
      category: "GENERAL_QUESTION",
      assignedAgentId: Math.random() > 0.65 ? pick(agentUsers).id : null,
      createdAt: daysAgo(days),
    });
    idx++;
  }

  // 35 technical questions
  for (const [subject, body] of technicalSubjects) {
    const c = customers[idx % customers.length];
    const days = Math.floor(Math.random() * 28);
    tickets.push({
      subject,
      body,
      fromName: c.name,
      fromEmail: c.email,
      status: pick<Status>(["OPEN", "RESOLVED", "CLOSED"]),
      category: "TECHNICAL_QUESTION",
      assignedAgentId: Math.random() > 0.4 ? pick(agentUsers).id : null,
      createdAt: daysAgo(days),
    });
    idx++;
  }

  // 31 refund requests
  for (const [subject, body] of refundSubjects) {
    const c = customers[idx % customers.length];
    const days = Math.floor(Math.random() * 28);
    tickets.push({
      subject,
      body,
      fromName: c.name,
      fromEmail: c.email,
      status: pick<Status>(["OPEN", "RESOLVED", "CLOSED"]),
      category: "REFUND_REQUEST",
      assignedAgentId: Math.random() > 0.5 ? pick(agentUsers).id : null,
      createdAt: daysAgo(days),
    });
    idx++;
  }
}

buildTickets();

async function seedTickets() {
  console.log(`🎫 Creating ${tickets.length} tickets...\n`);

  // Insert in batches for speed
  const BATCH = 20;
  let created = 0;
  for (let i = 0; i < tickets.length; i += BATCH) {
    const batch = tickets.slice(i, i + BATCH);
    await prisma.ticket.createMany({ data: batch });
    created += batch.length;
    console.log(`   ${created}/${tickets.length} created`);
  }

  const counts = await prisma.ticket.groupBy({
    by: ["status", "category"],
    _count: { _all: true },
  });

  console.log(`\n📊 Summary:`);
  for (const row of counts) {
    console.log(`   ${row.status.padEnd(8)} | ${row.category.padEnd(20)} | ${row._count._all}`);
  }

  console.log("\n✅ Done! Refresh the tickets page to see them.");
}

seedTickets()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
