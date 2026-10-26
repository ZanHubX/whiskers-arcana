import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./index.css";

type Language = "en" | "my";

type BookingResult = {
  id?: number | string;
  booking_reference: string;
  reading_type: string;
  customer_type: "local" | "overseas";
  amount: number | string;
  currency: string;
  status: string;
  customer_name?: string;
  email?: string;
  telegram_username?: string | null;
  questions?: string;
  scheduled_at?: string;
};

type PaymentMethod = {
  id: number;
  name: string;
  account_name?: string | null;
  account_number?: string | null;
  instructions?: string | null;
  qr_code_path?: string | null;
  is_active?: boolean;
};


type ReadingPackage = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  local_price: number | string;
  overseas_price: number | string;
  is_active: boolean;
  sort_order: number;
};

const READER_NAME = "Aye Mon Mon Kyaw";
const TELEGRAM_USERNAME = "iris_whisper";

const translations = {
  en: {
    navHome: "Home",
    navStory: "Meet the Reader",
    navReadings: "Readings",
    navBooking: "Book a Reading",
    navContact: "Contact",
    language: "မြန်မာ",
    heroEyebrow: "A LITTLE MAGIC · A MOMENT FOR YOU",
    heroTitle: "Your story is still\nbeing written.",
    heroText:
      "Find a quiet moment to reconnect with yourself, explore your questions, and discover a different perspective through tarot.",
    explore: "Explore Readings",
    meet: "Meet Your Reader",
    heroNote: "Trust your journey. Honour your own light.",
    storyEyebrow: "BEHIND THE CARDS",
    storyTitle: "A little about me.",
    storyIntro:
      "Welcome to Whiskers & Whispers Arcana, a little corner of the universe made for reflection, curiosity, and meaningful conversations.",
    storyHeading: "My journey with tarot",
    storyP1:
      "My interest in tarot began with its beautiful imagery and the stories hidden within each card. I became curious about how these symbols could help us pause, reflect, and look at familiar situations from a new perspective.",
    storyP2:
      "I created this space for people who want a thoughtful moment to explore their feelings, relationships, and personal journeys without feeling rushed or judged.",
    storyP3:
      "My approach is gentle, open-minded, and personal. I see tarot as a reflection tool, not a fixed prediction. Your choices belong to you, and you remain the author of your own story.",
    storyQuote:
      "The cards may offer a new perspective, but your path is yours to choose.",
    signature: "With warmth & stardust,",
    readerRole: "Tarot Reader · Whiskers & Whispers Arcana",
    serviceEyebrow: "CHOOSE YOUR JOURNEY",
    serviceTitle: "What would you like\nto explore today?",
    serviceText:
      "Choose the reading that feels closest to your question or what is on your mind.",
    priceLabel: "Reading fee",
    addQuestion: "+ Add another question",
    removeQuestion: "Remove",
    services: [
      {
        title: "One-Question Reading",
        description:
          "Explore one personal question through the symbolism of the tarot cards.",
        tag: "A gentle beginning",
      },
      {
        title: "Love & Relationships",
        description:
          "Reflect on feelings, relationship patterns, and what matters to your heart.",
        tag: "Matters of the heart",
      },
      {
        title: "Life Path & Reflection",
        description:
          "Explore personal growth, current challenges, and possible next steps.",
        tag: "A moment for yourself",
      },
    ],
    bookingEyebrow: "YOUR PERSONAL READING",
    bookingTitle: "Let's begin your journey.",
    bookingText:
      "Share a few details below to prepare your booking request. You can review it in Telegram before sending.",
    name: "Your name",
    namePlaceholder: "Enter your name",
    telegram: "Your Telegram username",
    telegramPlaceholder: "@yourusername",
    readingType: "Choose a reading",
    choose: "Select a reading type",
    question: "Your question (optional)",
    questionPlaceholder: "What would you like to explore?",
    date: "Preferred date (optional)",
    submit: "Prepare Booking in Telegram ↗",
    bookingPrivacy:
      "Please share only the information you're comfortable sending to your reader.",
    contactTitle: "A little clarity can begin with a conversation.",
    contactText:
      "Have a question before booking? Get in touch with your reader.",
    contactButton: "Open Telegram ↗",
    footerLine: "A little magic. A little meaning. A moment for you.",
    disclaimer:
      "Tarot readings are for personal reflection and entertainment. They do not replace professional medical, legal, or financial advice.",
    backTop: "Back to top ↑",
    fillName: "Please enter your name first.",
    fillType: "Please choose a reading type.",
  },
  my: {
    navHome: "ပင်မစာမျက်နှာ",
    navStory: "Reader အကြောင်း",
    navReadings: "Reading များ",
    navBooking: "Booking ယူရန်",
    navContact: "ဆက်သွယ်ရန်",
    language: "English",
    heroEyebrow: "မှော်ဆန်တဲ့ ခံစားမှု · ကိုယ့်အတွက် ခဏတာ",
    heroTitle: "သင့်ဘဝဇာတ်လမ်းက\nဆက်လက်ရေးသားနေဆဲပါ။",
    heroText:
      "ကိုယ့်စိတ်ကို ပြန်လည်နားထောင်ဖို့၊ စိတ်ထဲက မေးခွန်းတွေကို ဆင်ခြင်ဖို့နဲ့ Tarot ကတ်တွေကတစ်ဆင့် အမြင်သစ်တစ်ခု ရှာဖွေဖို့ အချိန်လေးတစ်ခု ပေးလိုက်ပါ။",
    explore: "Reading များ ကြည့်ရန်",
    meet: "Reader အကြောင်း သိရန်",
    heroNote: "ကိုယ့်ခရီးစဉ်ကို ယုံကြည်ပါ။ ကိုယ့်အလင်းကို တန်ဖိုးထားပါ။",
    storyEyebrow: "ကတ်လေးတွေရဲ့ နောက်ကွယ်မှာ",
    storyTitle: "ကျွန်မအကြောင်း အနည်းငယ်။",
    storyIntro:
      "Whiskers & Whispers Arcana မှ ကြိုဆိုပါတယ်။ ကိုယ့်အကြောင်းကို ပြန်လည်ဆင်ခြင်ဖို့၊ စူးစမ်းလေ့လာဖို့နဲ့ အဓိပ္ပာယ်ရှိတဲ့ စကားဝိုင်းလေးတွေ ဖန်တီးဖို့ ရည်ရွယ်ထားတဲ့ နေရာလေးတစ်ခုပါ။",
    storyHeading: "Tarot နဲ့ ကျွန်မရဲ့ ခရီးစဉ်",
    storyP1:
      "Tarot ကို စိတ်ဝင်စားလာခဲ့တာက ကတ်တစ်ကတ်စီရဲ့ လှပတဲ့ ပုံရိပ်တွေနဲ့ နောက်ကွယ်က ဇာတ်လမ်းတွေကြောင့်ပါ။ ဒီသင်္ကေတလေးတွေက ခဏရပ်ပြီး ကိုယ့်အခြေအနေတွေကို ရှုထောင့်အသစ်ကနေ ပြန်လည်ကြည့်ရှုနိုင်ဖို့ ဘယ်လိုအထောက်အကူပြုနိုင်မလဲဆိုတာ စူးစမ်းချင်လာခဲ့ပါတယ်။",
    storyP2:
      "ဒီနေရာလေးကို ဖန်တီးခဲ့တာက ကိုယ့်ခံစားချက်တွေ၊ ဆက်ဆံရေးတွေနဲ့ ကိုယ်ပိုင်ဘဝခရီးစဉ်ကို အလျင်မလိုဘဲ၊ အပြစ်တင်ခံရမှာ မစိုးရိမ်ဘဲ အေးအေးဆေးဆေး ပြန်လည်ဆင်ခြင်နိုင်ဖို့ပါ။",
    storyP3:
      "Reading လုပ်တဲ့အခါ ကျွန်မရဲ့ ချဉ်းကပ်ပုံက နူးညံ့မှု၊ ပွင့်လင်းမှုနဲ့ တစ်ဦးချင်းစီကို လေးစားမှုတို့ကို အခြေခံပါတယ်။ Tarot ကို အနာဂတ်ကို အတိအကျ ဆုံးဖြတ်ပေးတဲ့အရာလို့ မမြင်ဘဲ ကိုယ့်ကိုယ်ကို ပြန်လည်နားလည်ဖို့ အထောက်အကူပြုတဲ့ နည်းလမ်းတစ်ခုလို့ မြင်ပါတယ်။ သင့်ဘဝအတွက် ရွေးချယ်ဆုံးဖြတ်ပိုင်ခွင့်က သင့်လက်ထဲမှာပဲ ရှိနေပါတယ်။",
    storyQuote:
      "ကတ်လေးတွေက အမြင်သစ်တစ်ခု ပေးနိုင်ပေမဲ့ ကိုယ့်လမ်းကို ရွေးချယ်သူကတော့ ကိုယ်တိုင်ပါပဲ။",
    signature: "နွေးထွေးမှုလေးတွေနဲ့အတူ၊",
    readerRole: "Tarot Reader · Whiskers & Whispers Arcana",
    serviceEyebrow: "သင့်ခရီးစဉ်ကို ရွေးချယ်ပါ",
    serviceTitle: "ဒီနေ့ ဘယ်အကြောင်းအရာကို\nစူးစမ်းကြည့်ချင်ပါသလဲ။",
    serviceText:
      "သင့်စိတ်ထဲက မေးခွန်းနဲ့ အကိုက်ညီဆုံး Reading အမျိုးအစားကို ရွေးချယ်လိုက်ပါ။",
    priceLabel: "Reading ကြေး",
    addQuestion: "+ မေးခွန်း ထပ်ထည့်ရန်",
    removeQuestion: "ဖယ်ရှားရန်",
    services: [
      {
        title: "မေးခွန်းတစ်ခုအတွက် Reading",
        description:
          "သင့်စိတ်ထဲမှာ ရှိနေတဲ့ မေးခွန်းတစ်ခုကို Tarot ကတ်တွေရဲ့ သင်္ကေတတွေနဲ့အတူ ပြန်လည်စူးစမ်းကြည့်ပါ။",
        tag: "နူးညံ့တဲ့ အစပြုခြင်း",
      },
      {
        title: "အချစ်ရေးနှင့် ဆက်ဆံရေး",
        description:
          "ကိုယ့်ခံစားချက်တွေ၊ ဆက်ဆံရေးပုံစံတွေနဲ့ နှလုံးသားအတွက် တကယ်အရေးကြီးတဲ့အရာတွေကို ပြန်လည်ဆင်ခြင်ပါ။",
        tag: "နှလုံးသားရဲ့ အကြောင်းအရာ",
      },
      {
        title: "ဘဝလမ်းကြောင်းနှင့် ကိုယ်တိုင်ဆင်ခြင်မှု",
        description:
          "ကိုယ်တိုင်တိုးတက်ပြောင်းလဲမှု၊ လက်ရှိအခက်အခဲတွေနဲ့ ရှေ့ဆက်နိုင်မယ့် လမ်းကြောင်းတွေကို စူးစမ်းကြည့်ပါ။",
        tag: "ကိုယ့်အတွက် ခဏတာ",
      },
    ],
    bookingEyebrow: "သင့်အတွက် သီးသန့် Reading",
    bookingTitle: "သင့်ခရီးစဉ်ကို စတင်ကြရအောင်။",
    bookingText:
      "Booking request ပြင်ဆင်ဖို့ အောက်မှာ အချက်အလက်အနည်းငယ် ဖြည့်ပေးပါ။ Telegram မှာ မပို့ခင် ပြန်လည်စစ်ဆေးနိုင်ပါတယ်။",
    name: "သင့်အမည်",
    namePlaceholder: "အမည် ရိုက်ထည့်ပါ",
    telegram: "Telegram username",
    telegramPlaceholder: "@yourusername",
    readingType: "Reading အမျိုးအစား",
    choose: "Reading အမျိုးအစား ရွေးပါ",
    question: "မေးခွန်း (မဖြစ်မနေ မဟုတ်ပါ)",
    questionPlaceholder: "ဘယ်အကြောင်းအရာကို စူးစမ်းချင်ပါသလဲ။",
    date: "အဆင်ပြေမယ့် ရက်စွဲ (မဖြစ်မနေ မဟုတ်ပါ)",
    submit: "Telegram မှာ Booking ပြင်ဆင်ရန် ↗",
    bookingPrivacy:
      "Reader ထံ မျှဝေဖို့ အဆင်ပြေတဲ့ အချက်အလက်တွေကိုသာ ဖြည့်ပေးပါ။",
    contactTitle: "အမြင်သစ်တစ်ခုက စကားဝိုင်းလေးတစ်ခုကနေ စတင်နိုင်ပါတယ်။",
    contactText:
      "Booking မလုပ်ခင် မေးချင်တာရှိပါသလား။ Reader ထံ ဆက်သွယ်လိုက်ပါ။",
    contactButton: "Telegram ဖွင့်ရန် ↗",
    footerLine: "မှော်ဆန်မှုလေးတစ်ခု၊ အဓိပ္ပာယ်လေးတစ်ခု၊ သင့်အတွက် ခဏတာ။",
    disclaimer:
      "Tarot Reading များသည် ကိုယ်တိုင်ဆင်ခြင်သုံးသပ်ရန်နှင့် ဖျော်ဖြေရေးအတွက်သာ ဖြစ်ပါသည်။ ကျန်းမာရေး၊ ဥပဒေရေးရာနှင့် ငွေကြေးဆိုင်ရာ ကျွမ်းကျင်အကြံဉာဏ်များကို အစားမထိုးနိုင်ပါ။",
    backTop: "အပေါ်သို့ ↑",
    fillName: "ကျေးဇူးပြု၍ သင့်အမည်ကို ဖြည့်ပေးပါ။",
    fillType: "Reading အမျိုးအစားကို ရွေးပေးပါ။",
  },
};

function App() {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("wwa-language") === "my" ? "my" : "en",
  );

  const page = window.location.pathname.replace(/\/$/, "") || "/";
  const isHome = page === "/";
  const isReadings = page === "/readings";
  const isBooking = page === "/booking";

  const [formName, setFormName] = useState("");
  const [customerType, setCustomerType] = useState<
    "local" | "overseas" | ""
  >(() => {
    const value = new URLSearchParams(window.location.search).get(
      "customer_type",
    );
    return value === "local" || value === "overseas" ? value : "";
  });

  const [telegram, setTelegram] = useState("");
  const [reading, setReading] = useState(
    () => new URLSearchParams(window.location.search).get("package") || "",
  );
  const [questions, setQuestions] = useState<string[]>([""]);
  const [date, setDate] = useState("");
  const [formError, setFormError] = useState("");

  // Required for the booking submit button and handleBooking().
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createdBooking, setCreatedBooking] =
    useState<BookingResult | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const [proofSuccess, setProofSuccess] = useState("");
  const [paymentUploaded, setPaymentUploaded] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem("wwa-language", language);
  }, [language]);

  // Load active Reading Packages from the Laravel API so the customer view
  // always reflects the packages maintained in the admin panel.
  const [readingPackages, setReadingPackages] = useState<ReadingPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReadingPackages() {
      const apiBaseUrl = (
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
      ).replace(/\/$/, "");

      try {
        setPackagesLoading(true);
        setPackagesError("");

        const response = await fetch(`${apiBaseUrl}/reading-packages`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Could not load reading packages (${response.status}).`);
        }

        const result = await response.json();
        const items: ReadingPackage[] = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.packages)
              ? result.packages
              : [];

        if (!cancelled) {
          setReadingPackages(
            items
              .filter((item) => item.is_active !== false && Number(item.is_active) !== 0)
              .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setPackagesError(
            error instanceof Error
              ? error.message
              : "Could not load reading packages.",
          );
        }
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    }

    loadReadingPackages();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!reading || readingPackages.length === 0) return;
    if (readingPackages.some((item) => item.slug === reading)) return;

    const legacyNames: Record<string, string> = {
      single: "Single Question Reading",
      normal: "Normal Slot",
      priority: "Priority Slot - Urgent",
      guardian: "Guardian Connection",
      deep: "Deep Guidance",
      moon: "New Moon Beacon Reading",
      heart: "The Heart’s Spark",
      soul: "Soul Connection",
      bond: "Eternal Bond",
    };
    const legacyName = legacyNames[reading];
    const matchedPackage = legacyName
      ? readingPackages.find((item) => item.name.toLowerCase() === legacyName.toLowerCase())
      : undefined;

    if (matchedPackage) setReading(matchedPackage.slug);
  }, [reading, readingPackages]);

  const storyRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [language]);

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError(t.fillName);
      return;
    }

    if (!customerType) {
      setFormError(
        language === "my"
          ? "Local သို့မဟုတ် Overseas ကို အရင်ရွေးပေးပါ။"
          : "Please choose Local or Overseas first.",
      );
      return;
    }

    if (!reading) {
      setFormError(t.fillType);
      return;
    }

    if (!date) {
      setFormError(
        language === "my"
          ? "Booking အတွက် ရက်နဲ့အချိန် ရွေးပေးပါ။"
          : "Please choose a booking date and time.",
      );
      return;
    }

    if (!questions.some((item) => item.trim())) {
      setFormError(
        language === "my"
          ? "မေးခွန်း အနည်းဆုံးတစ်ခု ဖြည့်ပေးပါ။"
          : "Please enter at least one question.",
      );
      return;
    }

    const legacyPackageNames: Record<string, string> = {
      single: "Single Question Reading",
      normal: "Normal Slot",
      priority: "Priority Slot - Urgent",
      guardian: "Guardian Connection",
      deep: "Deep Guidance",
      moon: "New Moon Beacon Reading",
      heart: "The Heart’s Spark",
      soul: "Soul Connection",
      bond: "Eternal Bond",
    };
    const selectedPackage = readingPackages.find(
      (item) => item.slug === reading || item.name === reading,
    );
    const selectedPackageName =
      selectedPackage?.name || legacyPackageNames[reading] || reading;

    const apiBaseUrl = (
      import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
    ).replace(/\/$/, "");

    
const payload = {
  customer_name: formName.trim(),
  telegram_username: telegram.trim() || null,
  email: null,
  customer_type: customerType,

  // Send the package slug to Laravel, not its display name.
  reading_type: selectedPackage?.slug || reading,

  questions: questions
    .map((item, index) => `${index + 1}. ${item.trim()}`)
    .filter((item) => !item.match(/^\d+\. $/))
    .join("\n"),

  scheduled_at: date,
};


    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationMessages = data?.errors
          ? Object.values(data.errors).flat().join(" ")
          : data?.message;

        throw new Error(
          validationMessages ||
            (language === "my"
              ? "Booking မအောင်မြင်ပါ။ ပြန်စမ်းကြည့်ပါ။"
              : "Booking failed. Please try again."),
        );
      }

      const booking = data.booking as BookingResult;

      const completedBooking: BookingResult = {
        ...booking,
        customer_name: formName.trim(),
        email: undefined,
        telegram_username: telegram.trim() || null,
        customer_type: customerType,
        reading_type: selectedPackageName,
        questions: payload.questions,
        scheduled_at: date,
      };

      setCreatedBooking(completedBooking);
      setProofError("");
      setProofSuccess("");
      setPaymentUploaded(false);
      setSelectedPaymentMethod("");
      setTransactionReference("");
      setProofFile(null);

      try {
        const methodsResponse = await fetch(`${apiBaseUrl}/payment-methods`, {
          headers: { Accept: "application/json" },
        });

        const methodsData = await methodsResponse.json();

        if (!methodsResponse.ok) {
          throw new Error("Could not load payment methods.");
        }

        const methodList = Array.isArray(methodsData)
          ? methodsData
          : Array.isArray(methodsData?.data)
            ? methodsData.data
            : methodsData?.payment_methods ?? [];

        const activeMethods = methodList.filter(
          (method: PaymentMethod) => method.is_active !== false,
        );

        setPaymentMethods(activeMethods);

        setPaymentMethodsError(
          activeMethods.length
            ? ""
            : language === "my"
              ? "လက်ရှိအသုံးပြုနိုင်တဲ့ Payment Method မရှိသေးပါ။"
              : "No active payment methods are available yet.",
        );
      } catch {
        setPaymentMethods([]);
        setPaymentMethodsError(
          language === "my"
            ? "Payment Method များကို မရယူနိုင်ပါ။ Backend ကို စစ်ဆေးပါ။"
            : "Could not load payment methods. Please check the backend connection.",
        );
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : language === "my"
            ? "မသိရှိသော error ဖြစ်နေပါတယ်။"
            : "An unexpected error occurred.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const bookingDetailsText = createdBooking
    ? [
        "WHISKERS & WHISPERS ARCANA — BOOKING REQUEST",
        `Booking Reference: ${createdBooking.booking_reference}`,
        `Customer: ${createdBooking.customer_name || formName}`,
        `Telegram: ${createdBooking.telegram_username || telegram || "Not provided"}`,
        `Customer Type: ${createdBooking.customer_type === "overseas" ? "Overseas" : "Local"}`,
        `Reading: ${createdBooking.reading_type}`,
        `Scheduled At: ${createdBooking.scheduled_at || date}`,
        `Amount: ${createdBooking.amount} ${createdBooking.currency}`,
        `Questions: ${createdBooking.questions || questions.filter(Boolean).join("\n")}`,
        `Status: ${createdBooking.status || "pending_payment"}`,
      ].join("\n")
    : "";

  async function copyBookingDetails() {
    if (!bookingDetailsText) return;

    try {
      await navigator.clipboard.writeText(bookingDetailsText);
      setCopiedDetails(true);
      window.setTimeout(() => setCopiedDetails(false), 2500);
    } catch {
      setProofError(
        language === "my"
          ? "Copy မလုပ်နိုင်ပါ။ Booking details ကို ကိုယ်တိုင် select လုပ်ပြီး copy လုပ်ပါ။"
          : "Could not copy automatically. Please select and copy the booking details manually.",
      );
    }
  }

  function shareBookingOnTelegram() {
    if (!createdBooking || !bookingDetailsText.trim()) {
      setProofError(
        language === "my"
          ? "Booking details မတွေ့ပါ။"
          : "Booking details are not available yet.",
      );
      return;
    }

    // Open Telegram's native share composer; the user chooses the reader and presses Send.
    const telegramUrl = new URL("tg://msg_url");
    telegramUrl.searchParams.set("url", window.location.origin);
    telegramUrl.searchParams.set("text", bookingDetailsText);
    window.location.href = telegramUrl.toString();
  }

  async function handleProofUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProofError("");
    setProofSuccess("");

    if (!createdBooking?.booking_reference) {
      setProofError(
        language === "my"
          ? "Booking reference မတွေ့ပါ။"
          : "Booking reference is missing.",
      );
      return;
    }

    if (!selectedPaymentMethod) {
      setProofError(
        language === "my"
          ? "Payment Method ရွေးပါ။"
          : "Please select a payment method.",
      );
      return;
    }

    if (!proofFile) {
      setProofError(
        language === "my"
          ? "ငွေလွှဲပြေစာပုံ တင်ပေးပါ။"
          : "Please choose your payment receipt image.",
      );
      return;
    }

    const apiBaseUrl = (
      import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"
    ).replace(/\/$/, "");

    const formData = new FormData();
    formData.append("payment_method_id", selectedPaymentMethod);

    if (transactionReference.trim()) {
      formData.append("transaction_reference", transactionReference.trim());
    }

    formData.append("proof", proofFile);
    setIsUploadingProof(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/bookings/${encodeURIComponent(createdBooking.booking_reference)}/payment-proof`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationMessages = data?.errors
          ? Object.values(data.errors).flat().join(" ")
          : data?.message;

        throw new Error(
          validationMessages ||
            (language === "my"
              ? "Receipt တင်မအောင်မြင်ပါ။"
              : "Receipt upload failed."),
        );
      }

      setProofSuccess(
        language === "my"
          ? "Receipt တင်ပြီးပါပြီ။ Admin စစ်ဆေးအတည်ပြုရန် စောင့်ဆိုင်းပါ။"
          : "Receipt uploaded successfully. Please wait for admin review.",
      );

      setPaymentUploaded(true);

      setCreatedBooking((current) =>
        current ? { ...current, status: "pending_payment" } : current,
      );
    } catch (error) {
      setProofError(
        error instanceof Error
          ? error.message
          : language === "my"
            ? "Receipt တင်ရာတွင် error ဖြစ်နေပါတယ်။"
            : "An error occurred while uploading the receipt.",
      );
    } finally {
      setIsUploadingProof(false);
    }
  }

  return (
    <main className={`site lang-${language}`}>
      <header className="navbar">
        <a className="brand" href="/#home" aria-label="Home">
          <img
            src="/logo.jpg"
            className="brand-logo"
            alt="Whiskers & Whispers Arcana"
          />
          <span className="brand-name">
            <span>WHISKERS</span>
            <span className="brand-subtitle">& WHISPERS ARCANA</span>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <a onClick={() => setMenuOpen(false)} href="/#home">
            {t.navHome}
          </a>
          <a onClick={() => setMenuOpen(false)} href="/#story">
            {t.navStory}
          </a>
          <a onClick={() => setMenuOpen(false)} href="/readings">
            {t.navReadings}
          </a>
          <a
            onClick={() => setMenuOpen(false)}
            href="/booking"
            className="nav-booking-button"
          >
            {t.navBooking} ↗
          </a>
          <a onClick={() => setMenuOpen(false)} href="/#contact">
            {t.navContact}
          </a>
        </nav>

        <button
          className="language-toggle"
          type="button"
          onClick={() => setLanguage(language === "my" ? "en" : "my")}
        >
          <span>✦</span> {t.language}
        </button>
      </header>

      {isHome && (
        <>
          <section className="hero" id="home">
            <div className="hero-stars" aria-hidden="true">
              <span>✧</span>
              <span>✦</span>
              <span>✧</span>
              <span>·</span>
              <span>✦</span>
              <span>✧</span>
            </div>

            <div className="hero-content">
              <p className="eyebrow fade-up">{t.heroEyebrow}</p>
              <h1 className="fade-up delay-1">{t.heroTitle}</h1>
              <div className="ornament fade-up delay-2">
                <span />
                <b>✦</b>
                <span />
              </div>
              <p className="hero-description fade-up delay-2">{t.heroText}</p>
              <div className="hero-actions fade-up delay-3">
                <a href="/readings" className="button button-gold">
                  {t.explore} ↗
                </a>
                <a href="#story" className="button button-outline">
                  {t.meet}
                </a>
              </div>
              <p className="hero-note fade-up delay-3">☾ {t.heroNote}</p>
            </div>

            <span className="hero-moon" aria-hidden="true">
              ☾
            </span>
          </section>

          <section
            className="story-section"
            id="story"
            ref={storyRef}
          >
            <div className="story-photo-column reveal">
              <div className="photo-halo" />
              <div className="photo-frame">
                <img
                  src="/reader-photo.jpg"
                  alt={READER_NAME}
                  className="reader-photo"
                />
                <span className="photo-corner top-left" />
                <span className="photo-corner top-right" />
                <span className="photo-corner bottom-left" />
                <span className="photo-corner bottom-right" />
              </div>
              <div className="photo-caption">
                ✦ WHISKERS & WHISPERS ARCANA ✦
              </div>
              <p className="photo-small-note">
                A little space for magic and reflection
              </p>
            </div>

            <div className="story-content reveal">
              <p className="eyebrow">{t.storyEyebrow}</p>
              <h2>{t.storyTitle}</h2>
              <p className="story-intro">{t.storyIntro}</p>
              <div className="story-divider">
                <span>☾</span>
              </div>
              <h3>{t.storyHeading}</h3>
              <p>{t.storyP1}</p>
              <p>{t.storyP2}</p>
              <p>{t.storyP3}</p>
              <blockquote className="story-quote">{t.storyQuote}</blockquote>
              <div className="signature">
                <span>{t.signature}</span>
                <strong>{READER_NAME}</strong>
                <small>{t.readerRole}</small>
              </div>
            </div>
          </section>
        </>
      )}

      {isReadings && (
        <section className="readings section package-page" id="readings">
          <div className="section-heading reveal">
            <p className="eyebrow">
              {language === "my"
                ? "သင့်အတွက် Reading Package များ"
                : "CHOOSE YOUR READING"}
            </p>
            <h2>
              {language === "my"
                ? "သင့်အတွက် သင့်တော်တဲ့ Reading ကို ရွေးပါ"
                : "Find the reading that speaks to you."}
            </h2>
            <p className="section-description">
              {language === "my"
                ? "Reading package မရွေးခင် သင်နေထိုင်ရာကို အရင်ရွေးပေးပါ။ ရွေးချယ်မှုအလိုက် ဈေးနှုန်းကို ပြသပေးပါမယ်။"
                : "First choose where you live. We’ll show the applicable price for your selected location."}
            </p>
          </div>

          <div
            className="customer-type-selector reveal"
            style={{
              maxWidth: 620,
              margin: "0 auto 36px",
              padding: 24,
              border: "1px solid rgba(218, 188, 123, 0.55)",
              borderRadius: 16,
              background: "rgba(255,255,255,0.035)",
            }}
          >
            <label
              htmlFor="reading-customer-type"
              style={{
                display: "block",
                marginBottom: 12,
                fontWeight: 600,
                color: "var(--text, #f7e8c5)",
              }}
            >
              {language === "my"
                ? "သင် ဘယ်နေရာမှာ နေထိုင်ပါသလဲ။"
                : "Where do you currently live?"}
            </label>

            <select
              id="reading-customer-type"
              value={customerType}
              onChange={(event) =>
                setCustomerType(
                  event.target.value as "local" | "overseas" | "",
                )
              }
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 8,
                border: "1px solid rgba(218, 188, 123, 0.65)",
                background: "#24172d",
                color: "#f7e8c5",
                fontSize: 16,
              }}
            >
              <option value="">
                {language === "my"
                  ? "Local / Overseas ကို ရွေးပါ"
                  : "Choose Local or Overseas"}
              </option>
              <option value="local">
                {language === "my"
                  ? "Local — မြန်မာနိုင်ငံအတွင်း"
                  : "Local — Myanmar"}
              </option>
              <option value="overseas">
                {language === "my"
                  ? "Overseas — မြန်မာနိုင်ငံပြင်ပ"
                  : "Overseas — Outside Myanmar"}
              </option>
            </select>

            {!customerType && (
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#d8c7e8",
                  lineHeight: 1.6,
                }}
              >
                {language === "my"
                  ? "Package များနှင့် သက်ဆိုင်ရာဈေးနှုန်းကို ကြည့်ရန် အပေါ်မှာ အရင်ရွေးပေးပါ။"
                  : "Choose an option above to view the packages and their applicable prices."}
              </p>
            )}
          </div>

          {customerType ? (
            <>
              {packagesLoading ? (
                <p className="package-disclaimer">
                  {language === "my"
                    ? "Reading Packages များကို ရယူနေပါတယ်..."
                    : "Loading reading packages..."}
                </p>
              ) : packagesError ? (
                <p className="form-error" role="alert">
                  {language === "my"
                    ? `Package များကို ရယူမရပါ။ Backend API ကို စစ်ပါ။ (${packagesError})`
                    : packagesError}
                </p>
              ) : readingPackages.length === 0 ? (
                <p className="package-disclaimer">
                  {language === "my"
                    ? "လက်ရှိ အသုံးပြုနိုင်သော Reading Package မရှိသေးပါ။"
                    : "No active reading packages are available."}
                </p>
              ) : (
                <div className="package-grid">
                  {readingPackages.map((item, index) => (
                    <article className="package-card" key={item.id}>
                      <div className="package-card-top">
                        <span className="card-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="card-star">✧</span>
                      </div>

                      <div className="card-divider" />
                      <span className="package-tag">
                        {item.slug.replace(/-/g, " ")}
                      </span>

                      <h3>{item.name}</h3>
                      <p>{item.description || ""}</p>

                      <div className="package-price-row">
                        <span>
                          {customerType === "local"
                            ? language === "my" ? "Local ကြေး" : "Local price"
                            : language === "my" ? "Overseas ကြေး" : "Overseas price"}
                        </span>
                        <strong>
                          {Number(
                            customerType === "local"
                              ? item.local_price
                              : item.overseas_price,
                          ).toLocaleString()} MMK
                        </strong>
                      </div>

                      <a
                        className="card-book"
                        href={`/booking?package=${encodeURIComponent(item.slug)}&customer_type=${encodeURIComponent(customerType)}`}
                      >
                        {language === "my"
                          ? "ဒီ Reading ကို Booking လုပ်ရန် ↗"
                          : "Book this reading ↗"}
                      </a>
                    </article>
                  ))}
                </div>
              )}

              <p className="package-disclaimer">
                {language === "my"
                  ? "ဈေးနှုန်းသည် သင်ရွေးထားသော customer type အလိုက် ပြသထားခြင်းဖြစ်သည်။ Booking မပို့မီ Reader ၏ pricing policy ကို အတည်ပြုပါ။"
                  : "Prices shown match your selected location category. Please review the reader’s pricing policy before submitting your booking."}
              </p>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "28px 16px",
                color: "#d8c7e8",
              }}
            >
              {language === "my"
                ? "Package များကို ကြည့်ရန် Local သို့မဟုတ် Overseas ကို အရင်ရွေးပါ။"
                : "Please choose Local or Overseas above to see the reading packages."}
            </div>
          )}
        </section>
      )}

      {isBooking && (
        <section className="booking-section booking-page" id="booking">
          <div className="booking-layout">
            <div className="booking-copy reveal">
              <p className="eyebrow">{t.bookingEyebrow}</p>
              <h2>{t.bookingTitle}</h2>
              <p>{t.bookingText}</p>
              <div className="booking-ornament">✧ ☾ ✧</div>
              <p className="booking-privacy">{t.bookingPrivacy}</p>
            </div>

            <form className="booking-form reveal" onSubmit={handleBooking}>
              <label htmlFor="booking-name">{t.name}</label>
              <input
                id="booking-name"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder={t.namePlaceholder}
                autoComplete="name"
                required
              />

              <label htmlFor="booking-customer-type">
                {language === "my"
                  ? "Customer အမျိုးအစား (အရင်ရွေးပါ)"
                  : "Customer type (choose first)"}
              </label>

              <select
                id="booking-customer-type"
                value={customerType}
                onChange={(event) =>
                  setCustomerType(
                    event.target.value as "local" | "overseas" | "",
                  )
                }
                required
              >
                <option value="">
                  {language === "my"
                    ? "Local / Overseas ရွေးပါ"
                    : "Choose Local or Overseas"}
                </option>
                <option value="local">Local</option>
                <option value="overseas">Overseas</option>
              </select>

              <label htmlFor="booking-telegram">{t.telegram}</label>
              <input
                id="booking-telegram"
                value={telegram}
                onChange={(event) => setTelegram(event.target.value)}
                placeholder={t.telegramPlaceholder}
              />

              <label htmlFor="booking-reading">{t.readingType}</label>
              <select
                id="booking-reading"
                value={reading}
                onChange={(event) => setReading(event.target.value)}
                required
              >
                <option value="">{t.choose}</option>
                {readingPackages.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>

              <label htmlFor="booking-date">{t.date}</label>
              <input
                id="booking-date"
                type="datetime-local"
                value={date}
                min={new Date(Date.now() + 60_000)
                  .toISOString()
                  .slice(0, 16)}
                required
                onChange={(event) => setDate(event.target.value)}
              />

              <label>{t.question}</label>

              {questions.map((item, index) => (
                <div className="question-field" key={index}>
                  <textarea
                    id={`booking-question-${index}`}
                    rows={4}
                    required={index === 0}
                    value={item}
                    onChange={(event) =>
                      setQuestions((current) =>
                        current.map((questionText, questionIndex) =>
                          questionIndex === index
                            ? event.target.value
                            : questionText,
                        ),
                      )
                    }
                    placeholder={`${t.questionPlaceholder} (${index + 1})`}
                  />

                  {questions.length > 1 && (
                    <button
                      className="remove-question"
                      type="button"
                      onClick={() =>
                        setQuestions((current) =>
                          current.filter(
                            (_, questionIndex) => questionIndex !== index,
                          ),
                        )
                      }
                    >
                      {t.removeQuestion}
                    </button>
                  )}
                </div>
              ))}

              <button
                className="add-question"
                type="button"
                onClick={() => setQuestions((current) => [...current, ""])}
              >
                {t.addQuestion}
              </button>

              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <button
                className="button button-gold booking-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? language === "my"
                    ? "Booking သိမ်းဆည်းနေသည်..."
                    : "Creating booking..."
                  : language === "my"
                    ? "Booking တင်ရန်"
                    : "Create Booking"}
              </button>

              <p className="form-footnote">
                {language === "my"
                  ? "Booking တင်ပြီးနောက် Reference နဲ့ ကျသင့်ငွေကို ပြသပေးပါမယ်။ Booking သည် payment အတည်ပြုပြီးမှ confirmed ဖြစ်ပါမယ်။"
                  : "Your booking reference and fee will appear after submission. The booking is confirmed only after payment approval."}
              </p>
            </form>
          </div>
        </section>
      )}

      {createdBooking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-success-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setCreatedBooking(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(10, 5, 18, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "min(760px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#21162b",
              border: "1px solid #9b8051",
              borderRadius: "18px",
              padding: "clamp(20px, 4vw, 34px)",
              color: "#f8ebd1",
              boxShadow: "0 24px 80px rgba(0,0,0,.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                gap: "16px",
              }}
            >
              <div>
                <p className="eyebrow" style={{ marginTop: 0 }}>
                  {language === "my"
                    ? "BOOKING အောင်မြင်ပါပြီ"
                    : "BOOKING SUCCESSFUL"}
                </p>

                <h2 id="booking-success-title" style={{ marginTop: 0 }}>
                  {language === "my"
                    ? "သင့် Booking ကို သိမ်းဆည်းပြီးပါပြီ။"
                    : "Your booking has been created."}
                </h2>

                <p style={{ color: "#d8c7e8" }}>
                  {language === "my"
                    ? "အောက်ပါအချက်အလက်များကို copy လုပ်ပြီး Reader ထံ Telegram မှာ ပို့နိုင်ပါတယ်။"
                    : "Copy these details and send them to your reader on Telegram."}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close booking details"
                onClick={() => setCreatedBooking(null)}
                style={{
                  border: "1px solid #806b4e",
                  color: "#f8ebd1",
                  background: "transparent",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {paymentUploaded ? (
              <div
                className="payment-done-panel"
                style={{
                  textAlign: "center",
                  padding: "30px 18px 24px",
                  margin: "22px 0",
                  borderRadius: "16px",
                  border: "1px solid rgba(201,170,113,.55)",
                  background:
                    "linear-gradient(145deg, rgba(201,170,113,.16), rgba(255,255,255,.035))",
                }}
              >
                <style>{`
                  @keyframes paymentPop {
                    0% { transform: scale(.35); opacity: 0; }
                    70% { transform: scale(1.12); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  @keyframes paymentRing {
                    0% { transform: scale(.65); opacity: .2; }
                    100% { transform: scale(1.25); opacity: 0; }
                  }
                  .payment-done-icon {
                    animation: paymentPop .55s cubic-bezier(.2,.8,.2,1) both;
                  }
                  .payment-done-ring {
                    animation: paymentRing .9s ease-out both;
                  }
                  @media (prefers-reduced-motion: reduce) {
                    .payment-done-icon, .payment-done-ring {
                      animation: none;
                    }
                  }
                `}</style>

                <div
                  style={{
                    position: "relative",
                    width: "92px",
                    height: "92px",
                    margin: "0 auto 18px",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <span
                    className="payment-done-ring"
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: "2px solid #d8bb78",
                      borderRadius: "50%",
                    }}
                  />

                  <span
                    className="payment-done-icon"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: "76px",
                      height: "76px",
                      borderRadius: "50%",
                      color: "#21162b",
                      background: "linear-gradient(135deg, #f3dfa4, #c9aa71)",
                      fontSize: "40px",
                      fontWeight: 800,
                      boxShadow: "0 8px 28px rgba(201,170,113,.25)",
                    }}
                  >
                    ✓
                  </span>
                </div>

                <p className="eyebrow" style={{ margin: "0 0 8px" }}>
                  {language === "my"
                    ? "PAYMENT RECEIPT တင်ပြီးပါပြီ"
                    : "PAYMENT RECEIPT SUBMITTED"}
                </p>

                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: "clamp(24px, 4vw, 34px)",
                  }}
                >
                  {language === "my" ? "အောင်မြင်ပါပြီ bro!" : "All done!"}
                </h2>

                <p
                  style={{
                    color: "#d8c7e8",
                    maxWidth: "480px",
                    margin: "0 auto 20px",
                    lineHeight: 1.7,
                  }}
                >
                  {language === "my"
                    ? "သင့်ငွေလွှဲပြေစာကို လက်ခံရရှိပါပြီ။ Admin က စစ်ဆေးအတည်ပြုပြီးမှ Booking ကို Confirmed အဖြစ် ပြောင်းလဲပေးပါမယ်။"
                    : "Your receipt has been submitted successfully. The admin will review it; your booking is confirmed only after payment approval."}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    className="button button-gold"
                    onClick={copyBookingDetails}
                  >
                    {copiedDetails
                      ? language === "my"
                        ? "ကူးယူပြီးပါပြီ ✓"
                        : "Copied ✓"
                      : language === "my"
                        ? "Booking Details Copy လုပ်ရန်"
                        : "Copy Booking Details"}
                  </button>

                  <button
                    type="button"
                    className="button button-outline"
                    onClick={shareBookingOnTelegram}
                  >
                    {language === "my"
                      ? "Telegram မှာ မျှဝေရန် ↗"
                      : "Share on Telegram ↗"}
                  </button>

                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setCreatedBooking(null)}
                  >
                    {language === "my" ? "ပြီးပါပြီ" : "Done"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(201,170,113,.35)",
                    borderRadius: "12px",
                    padding: "16px",
                    margin: "18px 0",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  {bookingDetailsText}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "24px",
                  }}
                >
                  <button
                    type="button"
                    className="button button-gold"
                    onClick={copyBookingDetails}
                  >
                    {copiedDetails
                      ? language === "my"
                        ? "ကူးယူပြီးပါပြီ ✓"
                        : "Copied ✓"
                      : language === "my"
                        ? "Booking Details Copy လုပ်ရန်"
                        : "Copy Booking Details"}
                  </button>

                  <button
                    type="button"
                    className="button button-outline"
                    onClick={shareBookingOnTelegram}
                  >
                    {language === "my"
                      ? "Telegram မှာ မျှဝေရန် ↗"
                      : "Share on Telegram ↗"}
                  </button>

                  <a
                    className="button button-outline"
                    href={`https://telegram.me/${TELEGRAM_USERNAME}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {language === "my"
                      ? "Reader ကို ဆက်သွယ်ရန် ↗"
                      : "Open Reader Telegram ↗"}
                  </a>
                </div>

                <hr
                  style={{
                    border: 0,
                    borderTop: "1px solid rgba(201,170,113,.3)",
                    margin: "22px 0",
                  }}
                />

                <h3 style={{ marginBottom: "8px" }}>
                  {language === "my" ? "ငွေပေးချေမှု" : "Payment"}
                </h3>

                <p style={{ color: "#d8c7e8", marginTop: 0 }}>
                  {language === "my"
                    ? "Payment Method ကိုရွေးပြီး ငွေလွှဲပြေစာပုံကို တင်ပါ။"
                    : "Choose a payment method and upload your payment receipt."}
                </p>

                {paymentMethodsError && (
                  <p className="form-error" role="alert">
                    {paymentMethodsError}
                  </p>
                )}

                {paymentMethods.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <label htmlFor="modal-payment-method">
                      {language === "my"
                        ? "Payment Method ရွေးပါ"
                        : "Payment method"}
                    </label>

                    <select
                      id="modal-payment-method"
                      value={selectedPaymentMethod}
                      onChange={(event) =>
                        setSelectedPaymentMethod(event.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "13px",
                        borderRadius: "8px",
                        color: "#f8ebd1",
                        background: "#2b1d35",
                        border: "1px solid #806b4e",
                      }}
                    >
                      <option value="">
                        {language === "my"
                          ? "Payment Method ရွေးပါ"
                          : "Select a payment method"}
                      </option>

                      {paymentMethods.map((method) => (
                        <option key={method.id} value={String(method.id)}>
                          {method.name}
                        </option>
                      ))}
                    </select>

                    {paymentMethods
                      .filter(
                        (method) =>
                          String(method.id) === selectedPaymentMethod,
                      )
                      .map((method) => (
                        <div
                          key={method.id}
                          style={{
                            border: "1px solid rgba(201,170,113,.35)",
                            borderRadius: "10px",
                            padding: "14px",
                            lineHeight: 1.7,
                          }}
                        >
                          <strong>{method.name}</strong>

                          {method.account_name && (
                            <div>
                              {language === "my"
                                ? "အကောင့်အမည်"
                                : "Account name"}
                              : {method.account_name}
                            </div>
                          )}

                          {method.account_number && (
                            <div>
                              {language === "my"
                                ? "အကောင့်နံပါတ်"
                                : "Account number"}
                              : {method.account_number}
                            </div>
                          )}

                          {method.instructions && (
                            <div>{method.instructions}</div>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                <form
                  onSubmit={handleProofUpload}
                  style={{ display: "grid", gap: "12px" }}
                >
                  <label htmlFor="transaction-reference">
                    {language === "my"
                      ? "Transaction Reference (ရှိပါက)"
                      : "Transaction reference (optional)"}
                  </label>

                  <input
                    id="transaction-reference"
                    value={transactionReference}
                    onChange={(event) =>
                      setTransactionReference(event.target.value)
                    }
                    maxLength={255}
                    placeholder={
                      language === "my" ? "ငွေလွှဲနံပါတ်" : "Transfer / transaction ID"
                    }
                  />

                  <label htmlFor="payment-proof-file">
                    {language === "my"
                      ? "ငွေလွှဲပြေစာပုံ (JPG, PNG, WEBP · 5MB အထိ)"
                      : "Receipt image (JPG, PNG, WEBP · max 5MB)"}
                  </label>

                  <input
                    id="payment-proof-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={(event) =>
                      setProofFile(event.target.files?.[0] || null)
                    }
                  />

                  {proofError && (
                    <p className="form-error" role="alert">
                      {proofError}
                    </p>
                  )}

                  {proofSuccess && (
                    <p className="form-success" role="status">
                      {proofSuccess}
                    </p>
                  )}

                  <button
                    className="button button-gold"
                    type="submit"
                    disabled={
                      isUploadingProof || paymentMethods.length === 0
                    }
                  >
                    {isUploadingProof
                      ? language === "my"
                        ? "တင်နေသည်..."
                        : "Uploading..."
                      : language === "my"
                        ? "Receipt တင်ရန်"
                        : "Upload Payment Receipt"}
                  </button>
                </form>

                <p
                  style={{
                    color: "#b9a8c8",
                    fontSize: "12px",
                    lineHeight: 1.6,
                    marginTop: "16px",
                  }}
                >
                  {language === "my"
                    ? "Receipt တင်ပြီးနောက် Admin က စစ်ဆေးအတည်ပြုမည်။ Payment အတည်မပြုမချင်း Booking သည် confirmed မဖြစ်သေးပါ။"
                    : "Your receipt will be reviewed by the admin. The booking is not confirmed until payment is approved."}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {isHome && (
        <section className="contact-section" id="contact">
          <div className="contact-inner reveal">
            <span className="contact-moon">☾</span>
            <p className="eyebrow">{t.navContact}</p>
            <h2>{t.contactTitle}</h2>
            <p className="contact-description">{t.contactText}</p>

            <a
              className="button button-gold contact-button"
              href={`https://telegram.me/${TELEGRAM_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.contactButton}
            </a>
          </div>
        </section>
      )}

      <button
        className="scroll-to-top"
        type="button"
        aria-label={
          language === "my" ? "အပေါ်သို့ ပြန်တက်ရန်" : "Scroll to top"
        }
        title={
          language === "my" ? "အပေါ်သို့ ပြန်တက်ရန်" : "Scroll to top"
        }
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span aria-hidden="true">↑</span>
      </button>

      <footer className="footer">
        <a href="/#home" className="footer-brand">
          WHISKERS & WHISPERS ARCANA
        </a>
        <p className="footer-tagline">{t.footerLine}</p>
        <p className="footer-disclaimer">{t.disclaimer}</p>
        <a href="/#home" className="back-top">
          {t.backTop}
        </a>
        <div className="footer-bottom">☾ ✦ ☽</div>
      </footer>
    </main>
  );
}

export default App;