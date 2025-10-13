import type { 
    Post, 
    Class, 
    TimelineEvent, 
    HomeContent, 
    AboutContent, 
    ContactContent, 
    AdminUser,
    ClassRegistration,
    PageView,
} from './types';

// This structure defines the initial, empty state of your entire CMS.
// It's used to initialize the data store if it doesn't exist yet.

interface CMSData {
    homeContent: HomeContent;
    aboutContent: AboutContent;
    contactContent: ContactContent;
    adminUser: AdminUser;
    posts: Post[];
    classes: Class[];
    timeline: TimelineEvent[];
    registrations: ClassRegistration[];
    messages: unknown[]; // Using 'unknown' for messages as its type wasn't defined in types.ts
    analytics: PageView[];
}

export function getEmptyCMSData(): CMSData {
    return {
        homeContent: {
            slogan: {
              en: "Unlock Your Potential with Fluentia",
              de: "Entfalten Sie Ihr Potenzial mit Fluentia",
              fa: "پتانسیل خود را با فلوئنتیا شکوفا کنید"
            },
            subSlogan: {
              en: "Your journey to mastering German begins here. With expert guidance and a personalized approach, we make learning intuitive, effective, and truly engaging.",
              de: "Ihre Reise zur Beherrschung der deutschen Sprache beginnt hier. Mit fachkundiger Anleitung und einem persönlichen Ansatz machen wir das Lernen intuitiv, effektiv und wirklich fesselnd.",
              fa: "سفر شما برای تسلط بر زبان آلمانی از اینجا آغاز می‌شود. با راهنمایی تخصصی و رویکردی شخصی‌سازی شده، ما یادگیری را شهودی، مؤثر و واقعاً جذاب می‌کنیم."
            },
            ctaClasses: {
              en: "Explore Classes",
              de: "Kurse entdecken",
              fa: "مشاهده کلاس‌ها"
            },
            ctaFreeCourse: {
              en: "Try a Free Course",
              de: "Kostenlosen Kurs testen",
              fa: "دوره رایگان را امتحان کنید"
            },
            missionTitle: {
              en: "My Mission",
              de: "Meine Mission",
              fa: "رسالت من"
            },
            missionText: {
              en: "To provide a holistic and immersive learning experience that goes beyond grammar and vocabulary, fostering a genuine connection with the German language and culture.",
              de: "Eine ganzheitliche und immersive Lernerfahrung zu bieten, die über Grammatik und Vokabular hinausgeht und eine echte Verbindung zur deutschen Sprache und Kultur fördert.",
              fa: "ارائه یک تجربه یادگیری جامع و فراگیر که فراتر از گرامر و واژگان باشد و ارتباطی واقعی با زبان و فرهنگ آلمانی ایجاد کند."
            },
            manifestoTitle: {
              en: "The Fluentia Manifesto",
              de: "Das Fluentia-Manifest",
              fa: "مانیفست فلوئنتیا"
            },
            manifestoText: {
              en: "I believe in teaching German not just as a set of rules, but as a living, breathing entity. My method is rooted in the conviction that language learning should be a journey of discovery, not a chore. I focus on practical usage, cultural context, and building confidence, ensuring that every student not only learns German but also learns to love it.",
              de: "Ich glaube daran, Deutsch nicht nur als eine Reihe von Regeln zu lehren, sondern als eine lebendige, atmende Einheit. Meine Methode basiert auf der Überzeugung, dass das Sprachenlernen eine Entdeckungsreise sein sollte, keine lästige Pflicht. Ich konzentriere mich auf den praktischen Gebrauch, den kulturellen Kontext und den Aufbau von Selbstvertrauen, um sicherzustellen, dass jeder Schüler nicht nur Deutsch lernt, sondern auch lernt, es zu lieben.",
              fa: "من به آموزش زبان آلمانی نه تنها به عنوان مجموعه‌ای از قوانین، بلکه به عنوان یک موجود زنده و پویا باور دارم. روش من ریشه در این اعتقاد دارد که یادگیری زبان باید یک سفر اکتشافی باشد، نه یک کار طاقت‌فرسا. من بر استفاده عملی، زمینه فرهنگی و ایجاد اعتماد به نفس تمرکز می‌کنم و اطمینان می‌دهم که هر دانش‌آموز نه تنها آلمانی را یاد می‌گیرد، بلکه یاد می‌گیرد که آن را دوست داشته باشد."
            },
            recentPostsTitle: {
              en: "From the Blog",
              de: "Aus dem Blog",
              fa: "از وبلاگ"
            },
            readMore: {
              en: "Read More",
              de: "Weiterlesen",
              fa: "بیشتر بخوانید"
            },
            ctaTitle: {
              en: "Ready to Start Your Journey?",
              de: "Bereit, Ihre Reise zu beginnen?",
              fa: "برای شروع سفر خود آماده‌اید؟"
            },
            ctaText: {
              en: "Join a community of learners and take the next step towards fluency.",
              de: "Treten Sie einer Gemeinschaft von Lernenden bei und machen Sie den nächsten Schritt in Richtung Sprachkompetenz.",
              fa: "به جامعه‌ای از زبان‌آموزان بپیوندید و قدم بعدی را به سوی تسلط بر زبان بردارید."
            },
            seo: {
              title: {
                en: "Fluentia - German Language Mastery",
                de: "Fluentia - Deutsche Sprachbeherrschung",
                fa: "فلوئنتیا - تسلط بر زبان آلمانی"
              },
              description: {
                en: "Learn German effectively with personalized courses, expert guidance, and a focus on cultural immersion. Start your journey to fluency with Fluentia.",
                de: "Lernen Sie effektiv Deutsch mit personalisierten Kursen, fachkundiger Anleitung und einem Fokus auf kulturelles Eintauchen. Beginnen Sie Ihre Reise zur Sprachkompetenz mit Fluentia.",
                fa: "آلمانی را به طور مؤثر با دوره‌های شخصی‌سازی شده، راهنمایی تخصصی و تمرکز بر غوطه‌وری فرهنگی بیاموزید. سفر خود را به سوی تسلط بر زبان با فلوئنتیا آغاز کنید."
              }
            }
        },
        aboutContent: {
            title: {
              en: "My Story: A Passion for Language",
              de: "Meine Geschichte: Eine Leidenschaft für Sprache",
              fa: "داستان من: شور و اشتیاق برای زبان"
            },
            story: {
              en: "From a young age, I was fascinated by the intricate dance of words and the bridges they build between cultures. My journey with the German language began not in a classroom, but through the pages of classic literature and the melodies of German music. This passion evolved into a lifelong dedication to not only mastering the language but also understanding the soul behind it. After years of immersive study, living in Germany, and achieving near-native fluency, I discovered my true calling: guiding others on this beautiful journey. I founded Fluentia to create a learning environment that I always wished for – one that is supportive, culturally rich, and tailored to the individual's pace and goals.",
              de: "Schon in jungen Jahren war ich fasziniert von dem komplexen Tanz der Worte und den Brücken, die sie zwischen den Kulturen bauen. Meine Reise mit der deutschen Sprache begann nicht in einem Klassenzimmer, sondern auf den Seiten klassischer Literatur und den Melodien deutscher Musik. Diese Leidenschaft entwickelte sich zu einer lebenslangen Hingabe, nicht nur die Sprache zu beherrschen, sondern auch die Seele dahinter zu verstehen. Nach Jahren des intensiven Studiums, des Lebens in Deutschland und dem Erreichen nahezu muttersprachlicher Sprachkenntnisse entdeckte ich meine wahre Berufung: andere auf dieser wunderschönen Reise zu begleiten. Ich gründete Fluentia, um eine Lernumgebung zu schaffen, die ich mir immer gewünscht hatte – eine, die unterstützend, kulturell reich und auf das Tempo und die Ziele des Einzelnen zugeschnitten ist.",
              fa: "از سنین جوانی، مجذوب رقص پیچیده کلمات و پل‌هایی که بین فرهنگ‌ها می‌سازند، بودم. سفر من با زبان آلمانی نه در کلاس درس، بلکه از طریق صفحات ادبیات کلاسیک و ملودی‌های موسیقی آلمانی آغاز شد. این اشتیاق به یک تعهد مادام‌العمر تبدیل شد تا نه تنها بر زبان مسلط شوم، بلکه روح پشت آن را نیز درک کنم. پس از سال‌ها مطالعه فشرده، زندگی در آلمان و دستیابی به تسلطی نزدیک به زبان مادری، من رسالت واقعی خود را کشف کردم: راهنمایی دیگران در این سفر زیبا. من فلوئنتیا را تأسیس کردم تا محیط یادگیری‌ای را ایجاد کنم که همیشه آرزویش را داشتم - محیطی حمایتگر، غنی از نظر فرهنگی و متناسب با سرعت و اهداف هر فرد."
            },
            qualificationsTitle: {
              en: "My Qualifications",
              de: "Meine Qualifikationen",
              fa: "صلاحیت‌های من"
            },
            testdafTitle: {
              en: "Official TestDaF Examiner",
              de: "Offizieller TestDaF-Prüfer",
              fa: "ممتحن رسمی TestDaF"
            },
            testdafDescription: {
              en: "As a certified TestDaF examiner, I possess a deep understanding of the exam structure, scoring criteria, and the specific skills required for success. This expertise allows me to provide targeted, effective preparation for students aiming for high scores.",
              de: "Als zertifizierter TestDaF-Prüfer verfüge ich über ein tiefes Verständnis der Prüfungsstruktur, der Bewertungskriterien und der spezifischen Fähigkeiten, die für den Erfolg erforderlich sind. Diese Expertise ermöglicht es mir, eine gezielte und effektive Vorbereitung für Studenten anzubieten, die hohe Punktzahlen anstreben.",
              fa: "به عنوان یک ممتحن معتبر TestDaF، من درک عمیقی از ساختار آزمون، معیارهای نمره‌دهی و مهارت‌های خاص مورد نیاز برای موفقیت دارم. این تخصص به من این امکان را می‌دهد که آمادگی هدفمند و مؤثری را برای دانشجویانی که به دنبال نمرات بالا هستند، فراهم کنم."
            },
            timelineTitle: {
              en: "My Journey",
              de: "Mein Weg",
              fa: "سفر من"
            },
            seo: {
              title: {
                en: "About Me - The Fluentia Method",
                de: "Über mich - Die Fluentia-Methode",
                fa: "درباره من - متد فلوئنتیا"
              },
              description: {
                en: "Discover the story and qualifications behind Fluentia. Learn about my passion for the German language and my experience as a certified TestDaF examiner.",
                de: "Entdecken Sie die Geschichte und die Qualifikationen hinter Fluentia. Erfahren Sie mehr über meine Leidenschaft für die deutsche Sprache und meine Erfahrung als zertifizierter TestDaF-Prüfer.",
                fa: "داستان و صلاحیت‌های پشت فلوئنتیا را کشف کنید. درباره اشتیاق من به زبان آلمانی و تجربه‌ام به عنوان یک ممتحن معتبر TestDaF بیشتر بدانید."
              }
            }
        },
        contactContent: {
            title: {
              en: "Get in Touch",
              de: "Kontakt aufnehmen",
              fa: "تماس با من"
            },
            description: {
              en: "Have a question about a course, my teaching methods, or just want to say hello? I'd love to hear from you. Fill out the form below or use the contact details provided.",
              de: "Haben Sie eine Frage zu einem Kurs, meinen Lehrmethoden oder möchten Sie einfach nur Hallo sagen? Ich würde mich freuen, von Ihnen zu hören. Füllen Sie das folgende Formular aus oder nutzen Sie die angegebenen Kontaktdaten.",
              fa: "سوالی در مورد یک دوره، روش‌های تدریس من دارید یا فقط می‌خواهید سلامی کنید؟ خوشحال می‌شوم از شما بشنوم. فرم زیر را پر کنید یا از اطلاعات تماس ارائه شده استفاده کنید."
            },
            contactInfo: {
              en: "Contact Information",
              de: "Kontaktinformationen",
              fa: "اطلاعات تماس"
            },
            email: "info@fluentia.com",
            address: {
              en: "Berlin, Germany",
              de: "Berlin, Deutschland",
              fa: "برلین، آلمان"
            },
            linkedinUrl: "https://www.linkedin.com/in/yourprofile",
            telegramUrl: "https://t.me/yourprofile",
            seo: {
              title: {
                en: "Contact Fluentia",
                de: "Kontaktieren Sie Fluentia",
                fa: "تماس با فلوئنتیا"
              },
              description: {
                en: "Contact me for questions about German language courses, registration, and learning methods. Let's start your language journey together.",
                de: "Kontaktieren Sie mich bei Fragen zu Deutschkursen, Anmeldung und Lernmethoden. Lassen Sie uns Ihre Sprachreise gemeinsam beginnen.",
                fa: "برای سوالات در مورد دوره‌های زبان آلمانی، ثبت‌نام و روش‌های یادگیری با من تماس بگیرید. بیایید سفر زبانی شما را با هم آغاز کنیم."
              }
            }
        },
        adminUser: {
            email: process.env.ADMIN_EMAIL || "admin@example.com",
            password: process.env.ADMIN_PASSWORD || "password"
        },
        posts: [
            {
              slug: "demystifying-german-cases",
              title: {
                en: "Demystifying German Cases: A Beginner's Guide",
                de: "Die deutschen Fälle entmystifiziert: Ein Leitfaden für Anfänger",
                fa: "رمزگشایی از حالت‌های دستوری آلمانی: راهنمای مبتدیان"
              },
              excerpt: {
                en: "Nominative, Accusative, Dative, Genitive... If these terms sound intimidating, you're not alone. This guide breaks down the German case system into simple, understandable concepts.",
                de: "Nominativ, Akkusativ, Dativ, Genitiv... Wenn diese Begriffe einschüchternd klingen, sind Sie nicht allein. Dieser Leitfaden zerlegt das deutsche Kasussystem in einfache, verständliche Konzepte.",
                fa: "اسمی، مفعولی مستقیم، مفعولی غیرمستقیم، ملکی... اگر این اصطلاحات ترسناک به نظر می‌رسند، شما تنها نیستید. این راهنما سیستم حالت‌های دستوری آلمانی را به مفاهیم ساده و قابل فهم تقسیم می‌کند."
              },
              content: {
                en: "The German case system is the bedrock of its grammar. Understanding it is crucial for forming correct sentences. Let's start with the basics. The nominative case is used for the subject of a sentence – the person or thing doing the action. For example, in 'Der Hund schläft' (The dog sleeps), 'Der Hund' is in the nominative case. The accusative case is used for the direct object – the person or thing that receives the action. In 'Ich sehe den Hund' (I see the dog), 'den Hund' is in the accusative case. The dative case is for the indirect object, often the recipient of the direct object. For instance, 'Ich gebe dem Hund einen Ball' (I give the dog a ball), 'dem Hund' is dative. Finally, the genitive case shows possession, like in 'Das ist das Haus des Hundes' (That is the dog's house). Mastering these will revolutionize your German.",
                de: "Das deutsche Kasussystem ist das Fundament seiner Grammatik. Es zu verstehen ist entscheidend, um korrekte Sätze zu bilden. Beginnen wir mit den Grundlagen. Der Nominativ wird für das Subjekt eines Satzes verwendet – die Person oder Sache, die die Handlung ausführt. Zum Beispiel ist in 'Der Hund schläft' 'Der Hund' im Nominativ. Der Akkusativ wird für das direkte Objekt verwendet – die Person oder Sache, die die Handlung empfängt. In 'Ich sehe den Hund' ist 'den Hund' im Akkusativ. Der Dativ ist für das indirekte Objekt, oft der Empfänger des direkten Objekts. Zum Beispiel ist in 'Ich gebe dem Hund einen Ball' 'dem Hund' Dativ. Schließlich zeigt der Genitiv den Besitz an, wie in 'Das ist das Haus des Hundes'. Das Beherrschen dieser Fälle wird Ihr Deutsch revolutionieren.",
                fa: "سیستم حالت‌های دستوری آلمانی سنگ بنای گرامر آن است. درک آن برای ساختن جملات صحیح ضروری است. بیایید با اصول اولیه شروع کنیم. حالت اسمی برای فاعل جمله استفاده می‌شود - شخص یا چیزی که عمل را انجام می‌دهد. به عنوان مثال، در 'Der Hund schläft' (سگ می‌خوابد)، 'Der Hund' در حالت اسمی است. حالت مفعولی مستقیم برای مفعول مستقیم استفاده می‌شود - شخص یا چیزی که عمل را دریافت می‌کند. در 'Ich sehe den Hund' (من سگ را می‌بینم)، 'den Hund' در حالت مفعولی مستقیم است. حالت مفعولی غیرمستقیم برای مفعول غیرمستقیم است، که اغلب گیرنده مفعول مستقیم است. به عنوان مثال، 'Ich gebe dem Hund einen Ball' (من به سگ یک توپ می‌دهم)، 'dem Hund' در حالت غیرمستقیم است. در نهایت، حالت ملکی مالکیت را نشان می‌دهد، مانند 'Das ist das Haus des Hundes' (این خانه سگ است). تسلط بر این موارد، آلمانی شما را متحول خواهد کرد."
              },
              author: "Fluentia",
              date: "2024-05-20T10:00:00Z",
              category: "language",
              imageUrl: "https://images.unsplash.com/photo-1516476523928-1b4e85f40e79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxncmFt mar%20bookfGVufDB8fHx8MTc1Mzg4MzM2Nnww&ixlib=rb-4.1.0&q=80&w=1080",
              imageHint: "grammar book",
              tags: [{ en: "grammar", de: "Grammatik", fa: "گرامر" }, { en: "cases", de: "Fälle", fa: "حالت‌ها" }],
              seo: {
                title: {
                  en: "A Simple Guide to German Cases",
                  de: "Ein einfacher Leitfaden zu den deutschen Fällen",
                  fa: "راهنمای ساده برای حالت‌های دستوری آلمانی"
                },
                description: {
                  en: "Learn the basics of the nominative, accusative, dative, and genitive cases in German with clear explanations and examples.",
                  de: "Lernen Sie die Grundlagen der Fälle Nominativ, Akkusativ, Dativ und Genitiv im Deutschen mit klaren Erklärungen und Beispielen.",
                  fa: "اصول اولیه حالت‌های اسمی، مفعولی مستقیم، مفعولی غیرمستقیم و ملکی در زبان آلمانی را با توضیحات و مثال‌های واضح بیاموزید."
                }
              }
            },
            {
              slug: "german-culture-pünktlichkeit",
              title: {
                en: "More Than a Stereotype: Understanding German 'Pünktlichkeit'",
                de: "Mehr als ein Stereotyp: Die deutsche 'Pünktlichkeit' verstehen",
                fa: "فراتر از یک کلیشه: درک 'وقت‌شناسی' آلمانی"
              },
              excerpt: {
                en: "Punctuality, or 'Pünktlichkeit', is a cornerstone of German culture, but it's more than just being on time. It's a reflection of respect, reliability, and efficiency.",
                de: "Pünktlichkeit ist ein Eckpfeiler der deutschen Kultur, aber es ist mehr als nur pünktlich zu sein. Es ist ein Ausdruck von Respekt, Zuverlässigkeit und Effizienz.",
                fa: "وقت‌شناسی یا 'Pünktlichkeit'، سنگ بنای فرهنگ آلمانی است، اما چیزی فراتر از فقط به موقع بودن است. این بازتابی از احترام، قابلیت اطمینان و کارایی است."
              },
              content: {
                en: "When you have a meeting in Germany, arriving exactly on time is expected. Arriving even five minutes late can be seen as disrespectful, as it implies your time is more valuable than others'. This cultural trait extends beyond business. If you're invited to a friend's house for dinner at 7 PM, you should be ringing the doorbell at 7 PM sharp. This concept is deeply ingrained and is tied to the value placed on planning and organization. It ensures that processes run smoothly and that everyone's time is respected. So, next time you have an appointment in Germany, remember that being on time is the first, and perhaps most important, step to making a good impression.",
                de: "Wenn Sie in Deutschland ein Treffen haben, wird erwartet, dass Sie genau pünktlich erscheinen. Selbst fünf Minuten zu spät zu kommen, kann als respektlos angesehen werden, da es impliziert, dass Ihre Zeit wertvoller ist als die der anderen. Dieser kulturelle Zug geht über das Geschäftliche hinaus. Wenn Sie um 19 Uhr zum Abendessen bei einem Freund eingeladen sind, sollten Sie genau um 19 Uhr an der Tür klingeln. Dieses Konzept ist tief verwurzelt und hängt mit dem Wert zusammen, der auf Planung und Organisation gelegt wird. Es stellt sicher, dass Prozesse reibungslos ablaufen und die Zeit aller respektiert wird. Denken Sie also bei Ihrem nächsten Termin in Deutschland daran, dass Pünktlichkeit der erste und vielleicht wichtigste Schritt ist, um einen guten Eindruck zu hinterlassen.",
                fa: "وقتی در آلمان جلسه‌ای دارید، انتظار می‌رود که دقیقاً سر وقت برسید. حتی پنج دقیقه تأخیر می‌تواند بی‌احترامی تلقی شود، زیرا این مفهوم را می‌رساند که وقت شما از دیگران باارزش‌تر است. این ویژگی فرهنگی فراتر از کسب و کار است. اگر برای شام ساعت ۷ عصر به خانه دوستی دعوت شده‌اید، باید دقیقاً ساعت ۷ زنگ در را بزنید. این مفهوم عمیقاً ریشه دوانده و به ارزشی که برای برنامه‌ریزی و سازماندهی قائل هستند، گره خورده است. این امر تضمین می‌کند که فرآیندها به آرامی پیش بروند و به وقت همه احترام گذاشته شود. بنابراین، دفعه بعد که در آلمان قراری دارید، به یاد داشته باشید که به موقع بودن اولین و شاید مهم‌ترین قدم برای ایجاد یک تأثیر خوب است."
              },
              author: "Fluentia",
              date: "2024-05-15T14:30:00Z",
              category: "culture",
              imageUrl: "https://images.unsplash.com/photo-1596195217992-a7d1a2169622?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjbG9jayUyMGl uJTIwYmVybGlufGVufDB8fHx8MTc1Mzg4MzQzNXww&ixlib=rb-4.1.0&q=80&w=1080",
              imageHint: "clock berlin",
              tags: [{ en: "culture", de: "Kultur", fa: "فرهنگ" }, { en: "etiquette", de: "Etikette", fa: "آداب معاشرت" }],
              seo: {
                title: {
                  en: "Understanding Pünktlichkeit in German Culture",
                  de: "Pünktlichkeit in der deutschen Kultur verstehen",
                  fa: "درک وقت‌شناسی در فرهنگ آلمانی"
                },
                description: {
                  en: "Explore the cultural significance of punctuality (Pünktlichkeit) in Germany and why it's crucial for social and business interactions.",
                  de: "Entdecken Sie die kulturelle Bedeutung von Pünktlichkeit in Deutschland und warum sie für soziale und geschäftliche Interaktionen entscheidend ist.",
                  fa: "اهمیت فرهنگی وقت‌شناسی (Pünktlichkeit) در آلمان و چرایی حیاتی بودن آن برای تعاملات اجتماعی و کاری را کاوش کنید."
                }
              }
            },
            {
              slug: "5-tips-for-learning-german-faster",
              title: {
                en: "5 Essential Tips for Learning German Faster",
                de: "5 wesentliche Tipps, um schneller Deutsch zu lernen",
                fa: "۵ نکته ضروری برای یادگیری سریع‌تر زبان آلمانی"
              },
              excerpt: {
                en: "Ready to accelerate your German learning journey? These five practical tips will help you make progress more efficiently and effectively.",
                de: "Bereit, Ihre Deutsch-Lernreise zu beschleunigen? Diese fünf praktischen Tipps helfen Ihnen, effizienter und effektiver Fortschritte zu machen.",
                fa: "آماده‌اید تا سفر یادگیری آلمانی خود را سرعت ببخشید؟ این پنج نکته عملی به شما کمک می‌کند تا پیشرفت کارآمدتر و مؤثرتری داشته باشید."
              },
              content: {
                en: "1. Immerse Yourself: Surround yourself with German. Change your phone's language, watch German movies (with subtitles!), and listen to German music and podcasts. 2. Speak from Day One: Don't wait until you're 'ready'. Start speaking from the very beginning, even if it's just simple phrases. Mistakes are part of the process. 3. Focus on 'Der, Die, Das': Gender is tricky in German. Make it a habit to learn the article with every new noun. Use flashcards or color-coding to help. 4. Find a Language Partner: Practice with a native speaker. Websites like Tandem or HelloTalk can connect you with language partners for conversation exchange. 5. Be Consistent: Consistency is more important than intensity. A little bit of practice every day is far more effective than one long session per week. Viel Erfolg!",
                de: "1. Tauchen Sie ein: Umgeben Sie sich mit Deutsch. Ändern Sie die Sprache Ihres Telefons, schauen Sie deutsche Filme (mit Untertiteln!) und hören Sie deutsche Musik und Podcasts. 2. Sprechen Sie vom ersten Tag an: Warten Sie nicht, bis Sie 'bereit' sind. Fangen Sie von Anfang an an zu sprechen, auch wenn es nur einfache Sätze sind. Fehler sind Teil des Prozesses. 3. Konzentrieren Sie sich auf 'Der, Die, Das': Das Geschlecht ist im Deutschen knifflig. Machen Sie es sich zur Gewohnheit, den Artikel mit jedem neuen Substantiv zu lernen. Verwenden Sie Karteikarten oder Farbcodierungen zur Hilfe. 4. Finden Sie einen Sprachpartner: Üben Sie mit einem Muttersprachler. Websites wie Tandem oder HelloTalk können Sie mit Sprachpartnern für einen Gesprächsaustausch verbinden. 5. Seien Sie konsequent: Konsequenz ist wichtiger als Intensität. Ein bisschen Übung jeden Tag ist weitaus effektiver als eine lange Sitzung pro Woche. Viel Erfolg!",
                fa: "۱. خود را غرق کنید: خود را با زبان آلمانی محاصره کنید. زبان گوشی خود را تغییر دهید، فیلم‌های آلمانی (با زیرنویس!) تماشا کنید و به موسیقی و پادکست‌های آلمانی گوش دهید. ۲. از روز اول صحبت کنید: منتظر نمانید تا 'آماده' شوید. از همان ابتدا شروع به صحبت کنید، حتی اگر فقط عبارات ساده باشد. اشتباهات بخشی از فرآیند هستند. ۳. روی 'Der, Die, Das' تمرکز کنید: جنسیت در آلمانی پیچیده است. عادت کنید که حرف تعریف را با هر اسم جدید یاد بگیرید. از فلش‌کارت‌ها یا کدگذاری رنگی برای کمک استفاده کنید. ۴. یک شریک زبانی پیدا کنید: با یک فرد بومی تمرین کنید. وب‌سایت‌هایی مانند Tandem یا HelloTalk می‌توانند شما را با شرکای زبانی برای تبادل گفتگو مرتبط کنند. ۵. ثابت قدم باشید: ثبات مهم‌تر از شدت است. کمی تمرین هر روز بسیار مؤثرتر از یک جلسه طولانی در هفته است. موفق باشید!"
              },
              author: "Fluentia",
              date: "2024-05-10T09:00:00Z",
              category: "tips",
              imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsYW5ndWFnZSUyMGxlYXJuaW5nfGVufDB8fHx8MTc1Mzg4MzQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
              imageHint: "language learning",
              tags: [{ en: "learning", de: "Lernen", fa: "یادگیری" }, { en: "tips", de: "Tipps", fa: "نکات" }, { en: "efficiency", de: "Effizienz", fa: "کارایی" }],
              seo: {
                title: {
                  en: "Learn German Faster: 5 Practical Tips",
                  de: "Schneller Deutsch lernen: 5 praktische Tipps",
                  fa: "سریع‌تر آلمانی بیاموزید: ۵ نکته کاربردی"
                },
                description: {
                  en: "Accelerate your German language learning with five essential tips focusing on immersion, consistent practice, and smart study habits.",
                  de: "Beschleunigen Sie Ihr Deutschlernen mit fünf wesentlichen Tipps, die sich auf Immersion, konsequentes Üben und kluge Lerngewohnheiten konzentrieren.",
                  fa: "یادگیری زبان آلمانی خود را با پنج نکته ضروری با تمرکز بر غوطه‌وری، تمرین مداوم و عادات مطالعه هوشمند سرعت ببخشید."
                }
              }
            }
        ],
        classes: [
            {
              slug: "a1-beginner-course",
              title: {
                en: "A1 Beginner Course: Your First Step into German",
                de: "A1 Anfängerkurs: Ihr erster Schritt ins Deutsche",
                fa: "دوره مبتدی A1: اولین قدم شما به زبان آلمانی"
              },
              type: "group",
              level: "a1",
              status: "active",
              excerpt: {
                en: "Master the fundamentals of German in a dynamic group setting. This course covers basic grammar, essential vocabulary, and everyday conversations.",
                de: "Meistern Sie die Grundlagen des Deutschen in einer dynamischen Gruppenatmosphäre. Dieser Kurs behandelt grundlegende Grammatik, wesentlichen Wortschatz und alltägliche Konversationen.",
                fa: "بر اصول زبان آلمانی در یک محیط گروهی پویا مسلط شوید. این دوره گرامر پایه، واژگان ضروری و مکالمات روزمره را پوشش می‌دهد."
              },
              description: {
                en: "This comprehensive A1 course is designed for absolute beginners. We'll build a strong foundation, focusing on pronunciation, sentence structure, and practical communication skills. By the end of the course, you'll be able to introduce yourself, ask and answer simple questions, and understand common phrases used in daily life. Our interactive methodology ensures that you start speaking from day one.",
                de: "Dieser umfassende A1-Kurs ist für absolute Anfänger konzipiert. Wir bauen eine starke Grundlage auf und konzentrieren uns auf Aussprache, Satzstruktur und praktische Kommunikationsfähigkeiten. Am Ende des Kurses können Sie sich vorstellen, einfache Fragen stellen und beantworten und gebräuchliche Redewendungen des täglichen Lebens verstehen. Unsere interaktive Methodik stellt sicher, dass Sie vom ersten Tag an sprechen.",
                fa: "این دوره جامع A1 برای مبتدیان مطلق طراحی شده است. ما یک پایه قوی ایجاد خواهیم کرد و بر تلفظ، ساختار جمله و مهارت‌های ارتباطی عملی تمرکز خواهیم کرد. در پایان دوره، شما قادر خواهید بود خود را معرفی کنید، سوالات ساده بپرسید و پاسخ دهید و عبارات رایج مورد استفاده در زندگی روزمره را بفهمید. روش تعاملی ما تضمین می‌کند که شما از روز اول شروع به صحبت کنید."
              },
              objectives: [
                { en: "Understand and use familiar everyday expressions.", de: "Vertraute, alltägliche Ausdrücke verstehen und verwenden.", fa: "درک و استفاده از عبارات آشنای روزمره." },
                { en: "Introduce yourself and others.", de: "Sich und andere vorstellen.", fa: "معرفی خود و دیگران." },
                { en: "Ask and answer basic personal questions.", de: "Grundlegende persönliche Fragen stellen und beantworten.", fa: "پرسیدن و پاسخ دادن به سوالات شخصی ابتدایی." },
                { en: "Interact in a simple way provided the other person talks slowly and clearly.", de: "Auf einfache Weise interagieren, vorausgesetzt die andere Person spricht langsam und deutlich.", fa: "تعامل به روشی ساده، به شرطی که طرف مقابل آهسته و واضح صحبت کند." }
              ],
              prerequisites: [
                { en: "No prior knowledge of German is required.", de: "Keine Vorkenntnisse in Deutsch erforderlich.", fa: "هیچ دانش قبلی از زبان آلمانی لازم نیست." }
              ],
              imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjbGFzc3Jvb20lMjBsZWFybmluZ3xlbnwwfHx8fDE3NTM4ODM1Njd8MA&ixlib=rb-4.1.0&q=80&w=1080",
              imageHint: "classroom learning",
              schedule: {
                days: { en: "Mondays & Wednesdays", de: "Montags & Mittwochs", fa: "دوشنبه‌ها و چهارشنبه‌ها" },
                time: "18:00 - 19:30"
              },
              price: 1500000,
              maxStudents: 10,
              seo: {
                title: {
                  en: "German A1 Beginner Group Course",
                  de: "Deutsch A1 Anfänger-Gruppenkurs",
                  fa: "دوره گروهی مبتدی A1 آلمانی"
                },
                description: {
                  en: "Start your German learning journey with our interactive A1 group course. Build a strong foundation in grammar and conversation. Sign up now!",
                  de: "Beginnen Sie Ihre Deutsch-Lernreise mit unserem interaktiven A1-Gruppenkurs. Bauen Sie eine starke Grundlage in Grammatik und Konversation auf. Melden Sie sich jetzt an!",
                  fa: "سفر یادگیری آلمانی خود را با دوره گروهی تعاملی A1 ما آغاز کنید. یک پایه قوی در گرامر و مکالمه بسازید. هم اکنون ثبت‌نام کنید!"
                }
              }
            },
            {
              slug: "b2-exam-preparation-private",
              title: {
                en: "B2 Exam Preparation (Private Lessons)",
                de: "B2 Prüfungsvorbereitung (Privatunterricht)",
                fa: "آمادگی آزمون B2 (کلاس خصوصی)"
              },
              type: "private",
              level: "b2",
              status: "active",
              excerpt: {
                en: "Personalized one-on-one coaching to ace your B2 exam (e.g., Goethe, TestDaF). We'll focus on your specific weaknesses and master all parts of the test.",
                de: "Personalisiertes Einzelcoaching, um Ihre B2-Prüfung (z.B. Goethe, TestDaF) zu meistern. Wir konzentrieren uns auf Ihre spezifischen Schwächen und meistern alle Teile des Tests.",
                fa: "تدریس خصوصی و شخصی‌سازی شده برای موفقیت در آزمون B2 شما (مانند Goethe، TestDaF). ما بر روی نقاط ضعف خاص شما تمرکز کرده و بر تمام بخش‌های آزمون مسلط خواهیم شد."
              },
              description: {
                en: "This intensive private course is tailored to your individual needs. We will analyze your current level, identify areas for improvement, and create a customized study plan. Through targeted exercises, mock exams, and detailed feedback, we will systematically improve your skills in reading, listening, writing, and speaking to meet the B2 requirements. As a TestDaF examiner, I provide invaluable insights into the exam's logic and expectations.",
                de: "Dieser intensive Privatkurs ist auf Ihre individuellen Bedürfnisse zugeschnitten. Wir analysieren Ihr aktuelles Niveau, identifizieren Verbesserungspotenziale und erstellen einen maßgeschneiderten Lernplan. Durch gezielte Übungen, Probeprüfungen und detailliertes Feedback verbessern wir systematisch Ihre Fähigkeiten im Lesen, Hören, Schreiben und Sprechen, um die B2-Anforderungen zu erfüllen. Als TestDaF-Prüfer biete ich unschätzbare Einblicke in die Logik und die Erwartungen der Prüfung.",
                fa: "این دوره فشرده خصوصی متناسب با نیازهای فردی شما طراحی شده است. ما سطح فعلی شما را تحلیل کرده، حوزه‌های بهبود را شناسایی کرده و یک برنامه مطالعه سفارشی ایجاد خواهیم کرد. از طریق تمرینات هدفمند، آزمون‌های آزمایشی و بازخورد دقیق، ما به طور سیستماتیک مهارت‌های شما را در خواندن، شنیدن، نوشتن و صحبت کردن برای برآورده کردن الزامات B2 بهبود خواهیم داد. به عنوان یک ممتحن TestDaF، من بینش‌های ارزشمندی در مورد منطق و انتظارات آزمون ارائه می‌دهم."
              },
              objectives: [
                { en: "Master complex text comprehension.", de: "Komplexes Textverständnis meistern.", fa: "تسلط بر درک متون پیچیده." },
                { en: "Express yourself spontaneously and fluently.", de: "Sich spontan und fließend ausdrücken.", fa: "بیان خود به صورت خودجوش و روان." },
                { en: "Develop structured and detailed argumentation in writing.", de: "Strukturierte und detaillierte Argumentation im Schreiben entwickeln.", fa: "توسعه استدلال ساختاریافته و دقیق در نوشتار." },
                { en: "Understand the nuances of the exam format and scoring.", de: "Die Nuancen des Prüfungsformats und der Bewertung verstehen.", fa: "درک تفاوت‌های ظریف فرمت و نمره‌دهی آزمون." }
              ],
              prerequisites: [
                { en: "Solid B1 level German proficiency.", de: "Solide Deutschkenntnisse auf B1-Niveau.", fa: "تسلط کامل بر سطح B1 زبان آلمانی." },
                { en: "Commitment to intensive self-study.", de: "Verpflichtung zu intensivem Selbststudium.", fa: "تعهد به مطالعه فشرده شخصی." }
              ],
              imageUrl: "https://images.unsplash.com/photo-1517547196086-e6de1c21b2b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwdHV0b3Jpbmd8ZW58MHx8fHwxNzUzODgzNTk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
              imageHint: "private tutoring",
              schedule: {
                days: { en: "Flexible scheduling", de: "Flexible Terminplanung", fa: "زمان‌بندی انعطاف‌پذیر" },
                time: "By arrangement"
              },
              price: 5000000,
              seo: {
                title: {
                  en: "Private German B2 Exam Preparation Course",
                  de: "Privater Deutsch B2 Prüfungsvorbereitungskurs",
                  fa: "دوره خصوصی آمادگی آزمون B2 آلمانی"
                },
                description: {
                  en: "Ace your German B2 exam with personalized one-on-one coaching from a certified TestDaF examiner. Flexible scheduling available.",
                  de: "Meistern Sie Ihre Deutsch-B2-Prüfung mit personalisiertem Einzelcoaching von einem zertifizierten TestDaF-Prüfer. Flexible Terminplanung verfügbar.",
                  fa: "آزمون B2 آلمانی خود را با تدریس خصوصی و شخصی‌سازی شده توسط یک ممتحن معتبر TestDaF با موفقیت پشت سر بگذارید. زمان‌بندی انعطاف‌پذیر موجود است."
                }
              }
            },
            {
              slug: "free-mitreden-workshop",
              title: {
                en: "Free Workshop: 'Mitreden können!'",
                de: "Kostenloser Workshop: 'Mitreden können!'",
                fa: "کارگاه رایگان: 'توانایی شرکت در بحث!'"
              },
              type: "workshop",
              level: "b1",
              status: "active",
              excerpt: {
                en: "A free 90-minute workshop focused on improving your conversational skills, boosting your confidence, and learning idiomatic expressions.",
                de: "Ein kostenloser 90-minütiger Workshop zur Verbesserung Ihrer Konversationsfähigkeiten, zur Stärkung Ihres Selbstvertrauens und zum Erlernen idiomatischer Ausdrücke.",
                fa: "یک کارگاه ۹۰ دقیقه‌ای رایگان با تمرکز بر بهبود مهارت‌های مکالمه، افزایش اعتماد به نفس و یادگیری اصطلاحات رایج."
              },
              description: {
                en: "Do you understand a lot of German but struggle to speak fluently? This workshop is for you! 'Mitreden können' means 'to be able to join in the conversation,' and that's exactly our goal. In this interactive session, we will practice discussion techniques, learn common fillers and phrases to sound more natural, and overcome the fear of speaking. This is a safe and supportive environment to activate your passive knowledge.",
                de: "Verstehen Sie viel Deutsch, haben aber Schwierigkeiten, fließend zu sprechen? Dieser Workshop ist für Sie! 'Mitreden können' bedeutet, sich an einem Gespräch beteiligen zu können, und genau das ist unser Ziel. In dieser interaktiven Sitzung üben wir Diskussionstechniken, lernen gebräuchliche Füllwörter und Phrasen, um natürlicher zu klingen, und überwinden die Angst vor dem Sprechen. Dies ist eine sichere und unterstützende Umgebung, um Ihr passives Wissen zu aktivieren.",
                fa: "آیا آلمانی زیادی متوجه می‌شوید اما در صحبت کردن روان مشکل دارید؟ این کارگاه برای شماست! 'Mitreden können' به معنای 'توانایی شرکت در گفتگو' است و این دقیقاً هدف ماست. در این جلسه تعاملی، ما تکنیک‌های بحث را تمرین خواهیم کرد، کلمات و عبارات رایج برای طبیعی‌تر به نظر رسیدن را یاد خواهیم گرفت و بر ترس از صحبت کردن غلبه خواهیم کرد. این یک محیط امن و حمایتگر برای فعال کردن دانش غیرفعال شماست."
              },
              objectives: [
                { en: "Learn strategies to actively participate in discussions.", de: "Strategien zur aktiven Teilnahme an Diskussionen lernen.", fa: "یادگیری استراتژی‌هایی برای شرکت فعال در بحث‌ها." },
                { en: "Acquire common idiomatic expressions and fillers.", de: "Gängige idiomatische Ausdrücke und Füllwörter erlernen.", fa: "فراگیری اصطلاحات و تکیه‌کلام‌های رایج." },
                { en: "Boost your confidence in speaking German.", de: "Ihr Selbstvertrauen beim Deutschsprechen stärken.", fa: "افزایش اعتماد به نفس در صحبت کردن به زبان آلمانی." },
                { en: "Receive feedback on your pronunciation and fluency.", de: "Feedback zu Ihrer Aussprache und Sprachflüssigkeit erhalten.", fa: "دریافت بازخورد در مورد تلفظ و روانی کلام." }
              ],
              prerequisites: [
                { en: "Minimum B1 level is recommended.", de: "Mindestens B1-Niveau wird empfohlen.", fa: "حداقل سطح B1 توصیه می‌شود." }
              ],
              imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbnZlcnNhdGlvbnxlbnwwfHx8fDE3NTM4ODM2MzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
              imageHint: "business conversation",
              schedule: {
                days: { en: "Next session: June 5th", de: "Nächste Sitzung: 5. Juni", fa: "جلسه بعدی: ۵ ژوئن" },
                time: "19:00 - 20:30"
              },
              price: 0,
              maxStudents: 15,
              seo: {
                title: {
                  en: "Free German Conversation Workshop",
                  de: "Kostenloser deutscher Konversationsworkshop",
                  fa: "کارگاه رایگان مکالمه آلمانی"
                },
                description: {
                  en: "Join our free 'Mitreden können!' workshop to boost your German conversational skills and confidence. Open for B1 level and above.",
                  de: "Nehmen Sie an unserem kostenlosen 'Mitreden können!'-Workshop teil, um Ihre deutschen Konversationsfähigkeiten und Ihr Selbstvertrauen zu stärken. Offen für B1-Niveau und höher.",
                  fa: "به کارگاه رایگان 'Mitreden können!' ما بپیوندید تا مهارت‌های مکالمه و اعتماد به نفس آلمانی خود را افزایش دهید. برای سطح B1 و بالاتر."
                }
              }
            }
        ],
        timeline: [
            {
              year: "2015",
              title: {
                en: "Began University Studies",
                de: "Beginn des Universitätsstudiums",
                fa: "شروع تحصیلات دانشگاهی"
              },
              description: {
                en: "Started my academic journey in German Language and Literature, laying the theoretical foundation for my passion.",
                de: "Begann meine akademische Reise in der deutschen Sprache und Literatur und legte damit das theoretische Fundament für meine Leidenschaft.",
                fa: "سفر آکادمیک خود را در رشته زبان و ادبیات آلمانی آغاز کردم و پایه نظری اشتیاقم را بنا نهادم."
              }
            },
            {
              year: "2018",
              title: {
                en: "First Immersion Experience in Germany",
                de: "Erste Immersionserfahrung in Deutschland",
                fa: "اولین تجربه غوطه‌وری در آلمان"
              },
              description: {
                en: "Spent a semester abroad in Heidelberg, where I experienced the language and culture firsthand, transforming my academic knowledge into practical fluency.",
                de: "Verbrachte ein Auslandssemester in Heidelberg, wo ich die Sprache und Kultur aus erster Hand erlebte und mein akademisches Wissen in praktische Sprachkompetenz umwandelte.",
                fa: "یک ترم را در هایدلبرگ گذراندم، جایی که زبان و فرهنگ را از نزدیک تجربه کردم و دانش آکادمیک خود را به روانی عملی تبدیل کردم."
              }
            },
            {
              year: "2020",
              title: {
                en: "Graduated & Started Teaching",
                de: "Abschluss & Beginn des Unterrichtens",
                fa: "فارغ‌التحصیلی و شروع تدریس"
              },
              description: {
                en: "Graduated with honors and immediately began sharing my passion by teaching German at various language institutes.",
                de: "Abschluss mit Auszeichnung und sofortiger Beginn, meine Leidenschaft durch das Unterrichten von Deutsch an verschiedenen Sprachinstituten zu teilen.",
                fa: "با درجه ممتاز فارغ‌التحصیل شدم و بلافاصله با تدریس زبان آلمانی در مؤسسات مختلف زبان، اشتیاقم را به اشتراک گذاشتم."
              }
            },
            {
              year: "2022",
              title: {
                en: "Became a Certified TestDaF Examiner",
                de: "Zertifizierter TestDaF-Prüfer geworden",
                fa: "کسب گواهینامه ممتحن TestDaF"
              },
              description: {
                en: "Underwent rigorous training to become an official examiner for the TestDaF, gaining deep insights into the requirements for academic language proficiency.",
                de: "Durchlief eine strenge Ausbildung, um offizieller Prüfer für den TestDaF zu werden, und gewann tiefe Einblicke in die Anforderungen an die akademische Sprachkompetenz.",
                fa: "آموزش‌های دقیقی را برای تبدیل شدن به یک ممتحن رسمی TestDaF گذراندم و بینش عمیقی در مورد الزامات مهارت زبان آکادمیک به دست آوردم."
              }
            },
            {
              year: "2024",
              title: {
                en: "Founded Fluentia",
                de: "Gründung von Fluentia",
                fa: "تأسیس فلوئنتیا"
              },
              description: {
                en: "Launched Fluentia to offer a unique, personalized, and effective approach to learning German, combining my experience as a teacher and an examiner.",
                de: "Gründete Fluentia, um einen einzigartigen, personalisierten und effektiven Ansatz zum Deutschlernen anzubieten, der meine Erfahrung als Lehrerin und Prüferin kombiniert.",
                fa: "فلوئنتیا را برای ارائه یک رویکرد منحصر به فرد، شخصی‌سازی شده و مؤثر برای یادگیری زبان آلمانی، با ترکیب تجربه‌ام به عنوان یک معلم و یک ممتحن، راه‌اندازی کردم."
              }
            }
        ],
        registrations: [],
        messages: [],
        analytics: [],
    };
}
